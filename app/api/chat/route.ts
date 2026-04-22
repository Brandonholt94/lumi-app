import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, generateText, stepCountIs, tool, type ModelMessage } from 'ai'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { buildLumiSystemPrompt, LumiUserContext } from '@/lib/ai/lumi-prompt'
import { detectCrisis, CRISIS_RESPONSE, DISTRESS_CONTEXT } from '@/lib/ai/crisis-detection'
import { z } from 'zod'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Model routing ──────────────────────────────────────────
// Sonnet: emotional states, RSD, distress, re-entry, first message
// Haiku: casual, short, task-oriented, wired+action messages

const EMOTIONAL_KEYWORDS = [
  'anxious', 'anxiety', 'overwhelmed', 'overwhelm', 'panic', 'shame',
  'ashamed', 'embarrassed', 'rejected', 'rejection', 'worthless', 'failure',
  'failing', 'hopeless', 'hopelessness', 'sad', 'depressed', 'depression',
  'scared', 'afraid', 'alone', 'lonely', 'crying', 'cry', 'upset', 'hurt',
  'numb', 'empty', 'exhausted', 'burned out', 'burnout', 'can\'t cope',
  'shutdown', 'shutting down', 'rsd', 'spiral',
]

type ChatMessage = { role: string; content: string }

function shouldUseSonnet(
  mood: LumiUserContext['mood'],
  crisisTier: 'NONE' | 'DISTRESS' | 'CRISIS',
  messages: ChatMessage[],
  isReturningAfterAbsence?: boolean,
): boolean {
  // Always Sonnet for distress or returning users
  if (crisisTier === 'DISTRESS') return true
  if (isReturningAfterAbsence) return true

  // Sonnet for emotionally heavy moods
  if (mood === 'drained' || mood === 'low') return true

  // Check last user message for emotional keywords
  const lastMsg = [...messages].reverse().find(m => m.role === 'user')
  const text = (lastMsg?.content ?? '').toLowerCase()
  if (EMOTIONAL_KEYWORDS.some(kw => text.includes(kw))) return true

  // Longer messages (200+ chars) signal complexity — use Sonnet
  if (text.length > 200) return true

  // First message in session gets Sonnet for warmth
  const userMsgCount = messages.filter(m => m.role === 'user').length
  if (userMsgCount <= 1) return true

  return false
}

// ── Context summarization ──────────────────────────────────
// When history exceeds SUMMARIZE_THRESHOLD, compress old messages
// with Haiku and inject as contextSummary — keeps tokens manageable

const SUMMARIZE_THRESHOLD = 16  // total messages before summarizing
const KEEP_RECENT = 8           // verbatim messages to always keep

async function summarizeHistory(messages: ChatMessage[]): Promise<{
  summarizedContext: string
  trimmedMessages: ChatMessage[]
}> {
  const toSummarize = messages.slice(0, messages.length - KEEP_RECENT)
  const toKeep = messages.slice(messages.length - KEEP_RECENT)

  // Format old messages for Haiku to summarize
  const convoText = toSummarize
    .map(m => {
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      return `${m.role === 'user' ? 'User' : 'Lumi'}: ${text}`
    })
    .join('\n')

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      messages: [
        {
          role: 'user',
          content: `You are helping compress a conversation history for an AI companion app called Lumi that supports adults with ADHD.

Summarize the key emotional themes, what the user shared, how they were feeling, and any important context from this conversation excerpt. Be warm, specific, and brief (3-5 sentences max). Focus on what Lumi should remember to stay emotionally consistent.

Conversation:
${convoText}

Summary:`,
        },
      ],
      maxOutputTokens: 300,
    })

    return { summarizedContext: text.trim(), trimmedMessages: toKeep }
  } catch {
    // If summarization fails, just trim without summary
    return { summarizedContext: '', trimmedMessages: toKeep }
  }
}

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
  const [capturesRes, recentWinsRes, moodRes, activityRes, profileRes, sleepRes] = await Promise.all([
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

    // Most recent sleep log — last 2 days
    supabase
      .from('sleep_logs')
      .select('bedtime_hour, wake_hour, quality, log_date')
      .eq('clerk_user_id', userId)
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const captures = capturesRes.data ?? []
  const recentWins = recentWinsRes.data ?? []
  const lastMood = moodRes.data?.mood ?? null
  const lastSeenAt = activityRes.data?.last_seen_at ?? null
  const profile = profileRes.data ?? null
  const sleepRow = sleepRes.data ?? null

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
    recentCaptures: captures.slice(0, 10).map(c => ({ text: c.text, tag: c.tag, completed: c.completed ?? false })),
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
    // Sleep context — lets Lumi factor in rest quality
    sleepLastNight: sleepRow ? {
      duration: sleepRow.wake_hour >= sleepRow.bedtime_hour
        ? sleepRow.wake_hour - sleepRow.bedtime_hour
        : 24 - sleepRow.bedtime_hour + sleepRow.wake_hour,
      quality: sleepRow.quality as 'great' | 'okay' | 'rough' | null,
    } : null,
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

  // ── Context summarization ─────────────────────────────────
  // Compress old messages when history grows long to control token costs
  let activeMessages: ChatMessage[] = messages
  let historySummary: string | undefined

  if (messages.length > SUMMARIZE_THRESHOLD) {
    const { summarizedContext, trimmedMessages } = await summarizeHistory(messages)
    activeMessages = trimmedMessages
    historySummary = summarizedContext || undefined
  }

  // Inject history summary into user context if we have one
  const contextWithSummary: LumiUserContext = historySummary
    ? { ...userContext, contextSummary: historySummary }
    : userContext

  // Build system prompt — inject distress context if needed
  const baseSystem = buildLumiSystemPrompt(contextWithSummary)
  const system =
    crisis.tier === 'DISTRESS'
      ? `${baseSystem}\n\n## CURRENT MESSAGE ALERT\n${DISTRESS_CONTEXT}`
      : baseSystem

  // Flag distress for internal record (async, don't await)
  if (crisis.tier === 'DISTRESS') {
    flagCrisis(userId, 'DISTRESS', crisis.matched, lastContent)
  }

  // ── Model routing ──────────────────────────────────────────
  // Sonnet for emotional/companion moments, Haiku for casual exchanges
  const useSonnet = shouldUseSonnet(
    userContext.mood,
    crisis.tier,
    messages,
    userContext.isReturningAfterAbsence,
  )
  const model = useSonnet
    ? anthropic('claude-sonnet-4-5-20251001')
    : anthropic('claude-haiku-4-5-20251001')

  // ── Stream Lumi's response ─────────────────────────────────
  const result = streamText({
    model,
    system,
    messages: activeMessages as unknown as ModelMessage[],
    maxOutputTokens: 1024,
    stopWhen: stepCountIs(3),
    tools: {
      createCaptures: tool({
        description: "Add one or more items to the user's Brain Dump / capture list. Use this whenever the user asks to add, save, remember, or create tasks, ideas, worries, or reminders. Each item should be a separate capture.",
        inputSchema: z.object({
          items: z.array(z.object({
            text: z.string().describe('The capture text, written naturally'),
            tag: z.enum(['task', 'idea', 'worry', 'reminder']).describe('Type of capture — default to task if unclear'),
          })),
        }),
        execute: async ({ items }) => {
          const supabase = getServiceClient()
          await supabase.from('captures').insert(
            items.map((item: { text: string; tag: string }) => ({
              clerk_user_id: userId,
              text: item.text,
              tag: item.tag,
              completed: false,
            }))
          )
          return { created: items.length, items: items.map((i: { text: string }) => i.text) }
        },
      }),
    },
  })

  return result.toTextStreamResponse()
}
