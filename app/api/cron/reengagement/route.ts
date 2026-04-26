import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Rotated copy so ADHD brains don't habituate to the same message
const REENGAGEMENT_COPY = [
  {
    title: 'Hey — no judgment 💙',
    body:  'Life gets loud sometimes. Lumi\'s still here when you\'re ready.',
  },
  {
    title: 'You okay? 🌙',
    body:  'Haven\'t seen you in a bit. No pressure — just checking in.',
  },
  {
    title: 'Clean slate, whenever you\'re ready ✨',
    body:  'Doesn\'t matter how long it\'s been. Lumi remembers you.',
  },
  {
    title: 'Still here 💛',
    body:  'No guilt, no catch-up required. Just come as you are.',
  },
  {
    title: 'Miss you a little 🌅',
    body:  'Your brain\'s been busy. Lumi\'s been waiting. No rush.',
  },
]

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Find users who:
  // 1. Have a push subscription (opted in to notifications)
  // 2. Haven't had any app activity in the last 3 days
  // 3. Were active at some point (not brand-new, never-engaged accounts)
  const threeDaysAgo  = new Date(Date.now() - 3  * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Get all users with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')

  if (!subRows || subRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const subscribedIds = [...new Set(subRows.map(s => s.clerk_user_id))]

  // Get users who have been active recently enough that we know they're real users
  // but NOT active in the last 3 days (they've gone quiet)
  const { data: recentActivity } = await supabase
    .from('user_activity')
    .select('clerk_user_id')
    .in('clerk_user_id', subscribedIds)
    .gte('created_at', threeDaysAgo)

  const recentlyActiveIds = new Set((recentActivity ?? []).map(r => r.clerk_user_id))

  // Also get users who have some history (active at least once in last 14 days)
  // so we don't ping brand-new users who just haven't opened yet
  const { data: hasHistory } = await supabase
    .from('user_activity')
    .select('clerk_user_id')
    .in('clerk_user_id', subscribedIds)
    .gte('created_at', fourteenDaysAgo)

  const hasHistoryIds = new Set((hasHistory ?? []).map(r => r.clerk_user_id))

  // Candidates = has history + NOT active in last 3 days
  const candidateIds = subscribedIds.filter(
    id => hasHistoryIds.has(id) && !recentlyActiveIds.has(id)
  )

  if (candidateIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Fetch profiles (display_name + timezone) for timezone-local filtering
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, display_name, timezone')
    .in('clerk_user_id', candidateIds)

  const profileMap: Record<string, { name: string; timezone: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.clerk_user_id] = {
      name:     p.display_name ?? 'there',
      timezone: p.timezone     ?? 'America/New_York',
    }
  }

  // Only send to users where it's currently 10am in their local timezone.
  // Cron runs every hour — this ensures the re-engagement nudge arrives at
  // a friendly mid-morning time regardless of where the user lives.
  const now = new Date()
  const TARGET_HOUR = 10

  const eligibleIds = candidateIds.filter(id => {
    const tz = profileMap[id]?.timezone ?? 'America/New_York'
    try {
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        hour:     'numeric',
        hour12:   false,
        timeZone: tz,
      }).format(now)
      return (parseInt(localHourStr) % 24) === TARGET_HOUR
    } catch {
      return false
    }
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Use a deterministic copy variant per user so different users get
  // different messages, and it rotates week-over-week
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))

  const results = await Promise.allSettled(
    eligibleIds.map((userId, i) => {
      const copyIndex = (i + weekNumber) % REENGAGEMENT_COPY.length
      const { title, body } = REENGAGEMENT_COPY[copyIndex]
      return sendPushToUser(userId, { title, body, url: '/today' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
