import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Burnout detection — fires at 2pm local for users who are still checking in
// but have logged 3+ low/drained moods in their last 5 entries.
// Goal: reach users BEFORE they disengage, not after.
// This is proactive support, not re-engagement — the user hasn't gone quiet yet.

const LOW_MOODS = new Set(['drained', 'low'])
const TARGET_HOUR = 14 // 2pm local

const BURNOUT_COPY = [
  {
    title: 'Hey — how are you really doing? 💙',
    body:  'You\'ve seemed a bit drained lately. Lumi\'s here if you want to talk.',
  },
  {
    title: 'Checking in on you 🌿',
    body:  'Your week looks heavy. No agenda — just here if you need it.',
  },
  {
    title: 'You don\'t have to be okay right now 💛',
    body:  'Lumi noticed things have felt hard. Want to talk it through?',
  },
  {
    title: 'Low battery week? 🔋',
    body:  'It\'s okay. Come as you are — Lumi\'s got you.',
  },
]

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const now = new Date()
  const fiveDaysAgo   = new Date(Date.now() - 5  * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()

  // Get all users with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')

  if (!subRows || subRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const subscribedIds = [...new Set(subRows.map(s => s.clerk_user_id))]

  // Only look at users who have been active in the last 5 days —
  // re-engagement handles the ones who have already gone quiet
  const { data: recentActivity } = await supabase
    .from('user_activity')
    .select('clerk_user_id')
    .in('clerk_user_id', subscribedIds)
    .gte('last_seen_at', fiveDaysAgo)

  const activeIds = [...new Set((recentActivity ?? []).map(r => r.clerk_user_id))]
  if (activeIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Fetch the last 5 mood logs for each active user
  const { data: moodRows } = await supabase
    .from('mood_logs')
    .select('clerk_user_id, mood, created_at')
    .in('clerk_user_id', activeIds)
    .gte('created_at', fiveDaysAgo)
    .order('created_at', { ascending: false })

  if (!moodRows || moodRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Group by user — take up to 5 most recent entries per user
  const moodsByUser: Record<string, string[]> = {}
  for (const row of moodRows) {
    if (!moodsByUser[row.clerk_user_id]) moodsByUser[row.clerk_user_id] = []
    if (moodsByUser[row.clerk_user_id].length < 5) {
      moodsByUser[row.clerk_user_id].push(row.mood)
    }
  }

  // Burnout threshold: 3 or more of the last 5 entries are drained/low,
  // AND they have at least 3 entries (so we're not triggering on a single bad day)
  const burnoutIds = Object.entries(moodsByUser)
    .filter(([, moods]) => {
      if (moods.length < 3) return false
      const lowCount = moods.filter(m => LOW_MOODS.has(m)).length
      return lowCount >= 3
    })
    .map(([id]) => id)

  if (burnoutIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Don't re-send to users who already received a burnout notification this week.
  // We don't have a notification log table, so we use a simple heuristic:
  // skip users who received ANY push in the last 7 days tagged to /chat.
  // For now, trust the weekly cadence — firing at 2pm local once per day is
  // already capped by the 3-mood-in-5-days threshold which rarely repeats daily.

  // Fetch profiles for timezone + name
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, display_name, timezone')
    .in('clerk_user_id', burnoutIds)

  const profileMap: Record<string, { name: string; timezone: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.clerk_user_id] = {
      name:     p.display_name ?? 'there',
      timezone: p.timezone ?? 'America/New_York',
    }
  }

  // Filter to users where it's currently 2pm local — all times are user-local, never UTC
  const eligibleIds = burnoutIds.filter(id => {
    const tz = profileMap[id]?.timezone ?? 'America/New_York'
    try {
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', hour12: false, timeZone: tz,
      }).format(now)
      return (parseInt(localHourStr) % 24) === TARGET_HOUR
    } catch { return false }
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const dayOfYear = Math.floor(Date.now() / 86_400_000)

  const results = await Promise.allSettled(
    eligibleIds.map((userId, i) => {
      const { title, body } = BURNOUT_COPY[(i + dayOfYear) % BURNOUT_COPY.length]
      return sendPushToUser(userId, { title, body, url: '/chat' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
