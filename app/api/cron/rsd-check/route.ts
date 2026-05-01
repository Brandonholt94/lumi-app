import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// RSD proactive check — fires at 3pm local for users who logged drained/low mood
// today OR captured worry/rejection-flavored text. 3pm catches post-lunch/workday
// drained feelings before they spiral into the evening unaddressed.

const TARGET_HOUR = 15

const RSD_KEYWORDS = ['rejected', 'rejection', 'nobody', 'failed', 'failure', 'worthless',
  'hate myself', 'stupid', 'embarrassed', 'humiliated', 'ignored', 'too sensitive', 'overreacted']

const COPY = [
  {
    title: 'Checking in on you 💙',
    body:  'Today looked rough. You don\'t have to process it alone — Lumi\'s here when you\'re ready.',
  },
  {
    title: 'Hey — how are you really? 🌿',
    body:  'Noticed today felt heavy. No pressure, just wanted you to know Lumi\'s here.',
  },
  {
    title: 'You don\'t have to be okay 💛',
    body:  'Hard days are hard. Talking it through — even a little — can help. Lumi\'s listening.',
  },
  {
    title: 'Rough one? 🫂',
    body:  'Some days just hit different. Come talk when you\'re ready — no judgment, ever.',
  },
]

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase   = getServiceClient()
  const now        = new Date()
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)

  // Users with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')

  if (!subRows || subRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const subscribedIds = [...new Set(subRows.map(s => s.clerk_user_id))]

  // Fetch profiles for timezone
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, timezone')
    .in('clerk_user_id', subscribedIds)

  const timezoneMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    timezoneMap[p.clerk_user_id] = p.timezone ?? 'America/New_York'
  }

  // Filter to users where it's currently 7pm local
  const eligibleIds = subscribedIds.filter(id => {
    const tz = timezoneMap[id] ?? 'America/New_York'
    try {
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', hour12: false, timeZone: tz,
      }).format(now)
      return (parseInt(localHourStr) % 24) === TARGET_HOUR
    } catch { return false }
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Detect drained/overwhelmed mood today
  const { data: moodRows } = await supabase
    .from('mood_logs')
    .select('clerk_user_id')
    .in('clerk_user_id', eligibleIds)
    .gte('created_at', todayStart.toISOString())
    .in('mood', ['drained', 'low'])

  const drainedUsers = new Set((moodRows ?? []).map(r => r.clerk_user_id))

  // Detect rejection-flavored captures today
  const { data: captureRows } = await supabase
    .from('captures')
    .select('clerk_user_id, text')
    .in('clerk_user_id', eligibleIds)
    .gte('created_at', todayStart.toISOString())
    .in('tag', ['worry', 'thought'])

  const rsdUsers = new Set(
    (captureRows ?? [])
      .filter(r => RSD_KEYWORDS.some(kw => r.text?.toLowerCase().includes(kw)))
      .map(r => r.clerk_user_id)
  )

  const triggeredIds = eligibleIds.filter(id => drainedUsers.has(id) || rsdUsers.has(id))
  if (triggeredIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const dayOfYear = Math.floor(Date.now() / 86_400_000)

  const results = await Promise.allSettled(
    triggeredIds.map((userId, i) => {
      const { title, body } = COPY[(i + dayOfYear) % COPY.length]
      return sendPushToUser(userId, { title, body, url: '/chat' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: triggeredIds.length })
}
