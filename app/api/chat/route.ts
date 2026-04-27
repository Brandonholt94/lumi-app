import { streamText, generateText, stepCountIs, tool, type ModelMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { auth, currentUser } from '@clerk/nextjs/server'
import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildLumiSystemPrompt, LumiUserContext } from '@/lib/ai/lumi-prompt'
import { getUpcomingEvents } from '@/lib/google-calendar'
import { getMicrosoftUpcomingEvents } from '@/lib/microsoft-calendar'
import { detectCrisis, CRISIS_RESPONSE, DISTRESS_CONTEXT } from '@/lib/ai/crisis-detection'
import { sendPushToUser } from '@/lib/push'
import { z } from 'zod'


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

async function summarizeHistory(
  messages: ChatMessage[],
  anthropic: ReturnType<typeof createAnthropic>,
): Promise<{
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
      model: anthropic('claude-haiku-4-5'),
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
  const [capturesRes, recentWinsRes, moodRes, activityRes, profileRes, sleepRes, googleEvents, microsoftEvents, scheduledTasksRes] = await Promise.all([
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

    // Upcoming calendar events — Core/Companion only (returns [] if not connected)
    getUpcomingEvents(userId, 12),
    getMicrosoftUpcomingEvents(userId, 12),

    // Today's scheduled personal tasks (added to day timeline)
    supabase
      .from('captures')
      .select('text, scheduled_at, completed')
      .eq('clerk_user_id', userId)
      .gte('scheduled_at', todayStart.toISOString())
      .lt('scheduled_at', new Date(todayStart.getTime() + 86_400_000).toISOString())
      .order('scheduled_at', { ascending: true }),
  ])

  const captures      = capturesRes.data ?? []
  const recentWins    = recentWinsRes.data ?? []
  const scheduledTasks = scheduledTasksRes.data ?? []
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

  // Format scheduled tasks for Lumi context
  const scheduledTasksText = scheduledTasks.length > 0
    ? scheduledTasks.map(t => {
        const time = new Date(t.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        const status = t.completed ? '✓' : '○'
        return `  ${status} ${time} — ${t.text}`
      }).join('\n')
    : undefined

  return {
    recentCaptures: captures.slice(0, 10).map(c => ({ text: c.text, tag: c.tag, completed: c.completed ?? false })),
    captureCount: captures.length,
    focusTaskCompleted: completedTaskToday,
    recentWorries: worryCaptures.map(w => w.text),
    openWorryCount: worryCaptures.length,
    wins: winsText,
    isReturningAfterAbsence,
    daysSinceLastVisit,
    ...(scheduledTasksText ? { scheduledToday: scheduledTasksText } : {}),
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
    // Calendar events — merged from all connected providers, sorted by start time
    ...(() => {
      const allEvents = [...googleEvents, ...microsoftEvents].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )
      return allEvents.length > 0 ? { upcomingEvents: allEvents } : {}
    })(),
  } as Partial<LumiUserContext> & { _lastKnownMood?: string }
}

function streamText200(text: string): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } }),
    { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}

export async function POST(req: Request) {
  // ── Create provider inside the handler so any init error is catchable ──
  // (module-level singleton would crash the entire route if the key is missing)
  let anthropic: ReturnType<typeof createAnthropic>
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return streamText200('DEBUG: ANTHROPIC_API_KEY is not set in this environment.')
    }
    anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  } catch (err) {
    return streamText200(`DEBUG: Failed to init Anthropic provider — ${err}`)
  }

  let userId: string
  try {
    const { userId: uid } = await auth()
    if (!uid) return new Response('Unauthorized', { status: 401 })
    userId = uid!
  } catch (err) {
    return streamText200(`DEBUG: auth() threw — ${err}`)
  }

  // Client sends messages + lightweight context it owns (mood, focusTask)
  let messages: ChatMessage[]
  let clientContext: { plan?: string; mood?: string; focusTask?: string; focusTaskCompleted?: boolean } | undefined
  try {
    const body = await req.json()
    messages = body.messages
    clientContext = body.userContext
  } catch (e) {
    return streamText200(`DEBUG: Failed to parse request body — ${e}`)
  }

  // ── Wrap entire handler so any crash surfaces as a debug stream ──
  try {

  // Filter out messages with empty content — these accumulate from failed stream
  // attempts and cause Anthropic to reject the whole request with a 400.
  messages = messages.filter((m: ChatMessage) =>
    typeof m.content === 'string' ? m.content.trim().length > 0 : true
  )

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
    plan: clientContext?.plan ?? 'starter',
    mood: resolvedMood,
    focusTask: clientContext?.focusTask ?? undefined,
    ...serverContext,
    // If client just hit Done on the focus card, trust that immediately
    focusTaskCompleted: serverContext.focusTaskCompleted || clientContext?.focusTaskCompleted,
  }

  // ── Plan-based feature gates ───────────────────────────────
  // Plans: core (default) | companion. Starter plan has been retired.
  const plan = (userContext.plan ?? 'core') as string
  const isCompanion = plan.toLowerCase() === 'companion'

  // ── Context summarization ─────────────────────────────────
  // Compress old messages when history grows long to control token costs
  let activeMessages: ChatMessage[] = messages
  let historySummary: string | undefined

  if (messages.length > SUMMARIZE_THRESHOLD) {
    const { summarizedContext, trimmedMessages } = await summarizeHistory(messages, anthropic)
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
  // Companion: always Sonnet — no Haiku routing ever
  // Core/Starter: Sonnet for emotional moments, Haiku for casual
  const useSonnet = isCompanion || shouldUseSonnet(
    userContext.mood,
    crisis.tier,
    messages,
    userContext.isReturningAfterAbsence,
  )
  const model = useSonnet
    ? anthropic('claude-sonnet-4.6')
    : anthropic('claude-haiku-4-5')

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
        execute: async ({ items }: { items: Array<{ text: string; tag: string }> }) => {
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

  // Stream plain text — result.textStream gives clean text-only chunks
  // (avoids AI SDK v6 Data Stream Protocol encoding that the client can't parse)
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        const msg = String(err)
        console.error('[Lumi chat] stream error:', msg)
        controller.enqueue(encoder.encode(`Something went wrong on my end — ${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  // After the full response streams to the client, send a push notification —
  // but only if the user hasn't sent another message in the last 2 minutes.
  // This prevents a flood of "Lumi replied" banners during active conversations.
  // The service worker suppresses it automatically if the app window is focused,
  // so it only surfaces when the user has actually left.
  after(async () => {
    try {
      const supabase = getServiceClient()
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

      // Check last_seen_at — if user was active in the last 2 min, skip the push.
      // They're mid-conversation; the SW focus-check is a secondary guard.
      const { data: activity } = await supabase
        .from('user_activity')
        .select('last_seen_at')
        .eq('clerk_user_id', userId)
        .single()

      const lastSeen = activity?.last_seen_at
      if (lastSeen && new Date(lastSeen) > new Date(twoMinutesAgo)) return

      await sendPushToUser(userId, {
        title: 'Lumi replied 💬',
        body: 'Tap to continue your conversation.',
        url: '/chat',
      })
    } catch { /* never let push failure surface */ }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })

  } catch (err) {
    // Top-level catch — surfaces any crash (Supabase, Clerk, etc.) as a debug stream message
    const msg = String(err)
    console.error('[Lumi chat] unhandled error:', msg)
    return streamText200(`DEBUG: ${msg}`)
  }
}
