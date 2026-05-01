import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Hyperfocus detection — fires every hour, active 8pm–11pm local.
// Triggers when: user logged "wired" mood after 6pm today OR ran a focus
// session > 90 minutes today. Goal: gently interrupt before the 2am crash.

const TARGET_HOURS = new Set([20, 21, 22]) // 8–10pm local

const COPY = [
  {
    title: 'Still going? 🧠',
    body:  'You\'ve been locked in a while. Water, stretch, food — your future self will thank you.',
  },
  {
    title: 'Hyperfocus check-in ✨',
    body:  'Deep in it? That\'s a superpower. Just make sure you\'re taking care of your body too.',
  },
  {
    title: 'Hey — how\'s your body doing? 💙',
    body:  'You\'ve been going hard. Even 5 minutes of rest counts.',
  },
  {
    title: 'Still flowing? 🌊',
    body:  'Amazing focus today. When you\'re ready for a break, Lumi\'s here.',
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
  const sixPmUtcEquiv = new Date(now)
  sixPmUtcEquiv.setHours(sixPmUtcEquiv.getHours() - 2) // rough 6pm buffer for global users

  // Users with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')

  if (!subRows || subRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const subscribedIds = [...new Set(subRows.map(s => s.clerk_user_id))]

  // Fetch profiles for timezone
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, timezone, display_name')
    .in('clerk_user_id', subscribedIds)

  const profileMap: Record<string, { timezone: string; name: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.clerk_user_id] = {
      timezone: p.timezone ?? 'America/New_York',
      name:     p.display_name ?? 'there',
    }
  }

  // Filter to users where it's currently 8–10pm local
  const eligibleIds = subscribedIds.filter(id => {
    const tz = profileMap[id]?.timezone ?? 'America/New_York'
    try {
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', hour12: false, timeZone: tz,
      }).format(now)
      return TARGET_HOURS.has(parseInt(localHourStr) % 24)
    } catch { return false }
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Detect wired mood logged today
  const { data: moodRows } = await supabase
    .from('mood_logs')
    .select('clerk_user_id, mood, created_at')
    .in('clerk_user_id', eligibleIds)
    .gte('created_at', todayStart.toISOString())
    .in('mood', ['wired', 'bright'])

  const wiredUsers = new Set((moodRows ?? []).map(r => r.clerk_user_id))

  // Detect long focus sessions today (> 90 mins)
  const { data: focusRows } = await supabase
    .from('focus_sessions')
    .select('clerk_user_id, actual_duration')
    .in('clerk_user_id', eligibleIds)
    .gte('started_at', todayStart.toISOString())

  const longFocusUsers = new Set(
    (focusRows ?? [])
      .filter(r => (r.actual_duration ?? 0) >= 90 * 60)
      .map(r => r.clerk_user_id)
  )

  const triggeredIds = eligibleIds.filter(id => wiredUsers.has(id) || longFocusUsers.has(id))
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
