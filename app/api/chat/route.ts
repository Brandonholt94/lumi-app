import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { buildLumiSystemPrompt, LumiUserContext } from '@/lib/ai/lumi-prompt'
import { detectCrisis, CRISIS_RESPONSE, DISTRESS_CONTEXT } from '@/lib/ai/crisis-detection'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function flagCrisis(
  userId: string,
  tier: 'CRISIS' | 'DISTRESS',
  matched: string | null,
  messageExcerpt: string
) {
  try {
    const supabase = getServiceClient()
    await supabase.from('crisis_flags').insert({
      clerk_user_id: userId,
      tier,
      matched_phrase: matched,
      message_excerpt: messageExcerpt.slice(0, 200),
    })
  } catch {
    // Silently fail — never let logging break the user experience
  }
}

// Pull full platform context from Supabase — today + recent history
async function fetchPlatformContext(userId: string): Promise<Partial<LumiUserContext>> {
  const supabase = getServiceClient()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Run all queries in parallel
  const [capturesRes, recentWinsRes, moodRes, activityRes, profileRes] = await Promise.all([
    // Today's captures — tasks, worries, ideas
    supabase
      .from('captures')
      .select('id, text, tag, completed, addressed')
      .eq('clerk_user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false }),

    // Recent wins — tasks completed in the last 48hrs (includes yesterday)
    supabase
      .from('captures')
      .select('text, tag, completed, created_at')
      .eq('clerk_user_id', userId)
      .eq('completed', true)
      .gte('created_at', fortyEightHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5),

    // Most recent mood log — today or recent, as fallback if client doesn't pass mood
    supabase
      .from('mood_logs')
      .select('mood, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    // Last seen — for absence detection
    supabase
      .from('user_activity')
      .select('last_seen_at')
      .eq('clerk_user_id', userId)
      .single(),

    // Onboarding profile
    supabase
      .from('profiles')
      .select('display_name, adhd_identity, biggest_struggle, hardest_time, support_situation, tone_preference, plan')
      .eq('clerk_user_id', userId)
      .single(),
  ])

  const captures = capturesRes.data ?? []
  const recentWins = recentWinsRes.data ?? []
  const lastMood = moodRes.data?.mood ?? null
  const lastSeenAt = activityRes.data?.last_seen_at ?? null
  const profile = profileRes.data ?? null

  // Today's captures broken down
  const worryCaptures = captures.filter(c => c.tag === 'worry' && !c.addressed)
  const completedTaskToday = captures.some(c =>
    (c.tag === 'task' || !c.tag) && c.completed
  )

  // Recent wins — format for prompt (yesterday's wins are the most important)
  const winsText = recentWins.length > 0
    ? recentWins.map(w => {
        const date = new Date(w.created_at)
        const isToday = date >= todayStart
        const label = isToday ? 'today' : 'recently'
        return `- Completed ${label}: "${w.text}"`
      }).join('\n')
    : undefined

  // Absence detection — 2+ days away = re-entry protocol
  let isReturningAfterAbsence = false
  let daysSinceLastVisit: number | undefined

  if (lastSeenAt) {
    const lastSeen = new Date(lastSeenAt)
    const hoursSince = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60)
    daysSinceLastVisit = Math.floor(hoursSince / 24)
    // 48+ hours = they've been genuinely away, apply re-entry warmth
    isReturningAfterAbsence = hoursSince >= 48
  }

  return {
    recentCaptures: captures.slice(0, 10).map(c => ({ text: c.text, tag: c.tag })),
    captureCount: captures.length,
    focusTaskCompleted: completedTaskToday,
    recentWorries: worryCaptures.map(w => w.text),
    openWorryCount: worryCaptures.length,
    wins: winsText,
    isReturningAfterAbsence,
    daysSinceLastVisit,
    // Onboarding profile
    ...(profile?.display_name      ? { name:             profile.display_name }      : {}),
    ...(profile?.adhd_identity     ? { adhdIdentity:     profile.adhd_identity }     : {}),
    ...(profile?.biggest_struggle  ? { biggestStruggle:  profile.biggest_struggle }  : {}),
    ...(profile?.hardest_time      ? { hardestTime:      profile.hardest_time }      : {}),
    ...(profile?.support_situation ? { supportSituation: profile.support_situation } : {}),
    ...(profile?.tone_preference   ? { tonePreference:   profile.tone_preference }   : {}),
    ...(profile?.plan              ? { plan:             profile.plan }              : {}),
    // Pass last known mood as fallback — chat will prefer client-passed mood
    ...(lastMood ? { _lastKnownMood: lastMood } : {}),
  } as Partial<LumiUserContext> & { _lastKnownMood?: string }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  // Client sends messages + lightweight context it owns (mood, focusTask)
  const { messages, userContext: clientContext } = await req.json()

  // Get the last user message for crisis detection
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string; content: string }) => m.role === 'user')
  const lastContent: string = lastUserMessage?.content ?? ''

  // ── Crisis pre-filter ──────────────────────────────────────
  const crisis = detectCrisis(lastContent)

  if (crisis.tier === 'CRISIS') {
    await flagCrisis(userId, 'CRISIS', crisis.matched, lastContent)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const char of CRISIS_RESPONSE) {
          controller.enqueue(encoder.encode(char))
        }
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // ── Build full context ─────────────────────────────────────
  // Fetch Clerk user for name
  const clerkUser = await currentUser()
  const name = clerkUser?.firstName ?? undefined

  // Fetch platform activity from Supabase (server-side — not client-trusted)
  const platformContext = await fetchPlatformContext(userId)

  // Merge context — client owns mood + focusTask (live UI state),
  // server owns everything fetched from Supabase.
  // Mood priority: client-passed (just selected) → Supabase last known → null
  const { _lastKnownMood, ...serverContext } = platformContext as Partial<LumiUserContext> & { _lastKnownMood?: string }
  const resolvedMood = (clientContext?.mood ?? _lastKnownMood ?? null) as LumiUserContext['mood']

  const userContext: LumiUserContext = {
    name,
    plan: clientContext?.plan ?? 'free',
    mood: resolvedMood,
    focusTask: clientContext?.focusTask ?? undefined,
    ...serverContext,
    // If client just hit Done on the focus card, trust that immediately
    focusTaskCompleted: serverContext.focusTaskCompleted || clientContext?.focusTaskCompleted,
  }

  // Build system prompt — inject distress context if needed
  const baseSystem = buildLumiSystemPrompt(userContext)
  const system =
    crisis.tier === 'DISTRESS'
      ? `${baseSystem}\n\n## CURRENT MESSAGE ALERT\n${DISTRESS_CONTEXT}`
      : baseSystem

  // Flag distress for internal record (async, don't await)
  if (crisis.tier === 'DISTRESS') {
    flagCrisis(userId, 'DISTRESS', crisis.matched, lastContent)
  }

  // ── Stream Lumi's response ─────────────────────────────────
  const result = streamText({
    model: anthropic('claude-sonnet-4.6'),
    system,
    messages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
