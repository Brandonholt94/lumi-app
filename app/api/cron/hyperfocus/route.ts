import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Hyperfocus detection — fires every hour, active 10am–8pm local.
// Triggers when: user logged "wired" mood OR ended a focus session > 90 min
// IN THE LAST 2 HOURS. Recency window means it fires once when the behavior
// is detected, not all day long.

const ACTIVE_START = 10 // 10am local
const ACTIVE_END   = 20 //  8pm local

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

  const supabase  = getServiceClient()
  const now       = new Date()
  const twoHrsAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

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

  // Filter to users where it's currently 10am–8pm local
  const eligibleIds = subscribedIds.filter(id => {
    const tz = timezoneMap[id] ?? 'America/New_York'
    try {
      const h = parseInt(
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(now)
      ) % 24
      return h >= ACTIVE_START && h < ACTIVE_END
    } catch { return false }
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Wired mood logged in the last 2 hours
  const { data: moodRows } = await supabase
    .from('mood_logs')
    .select('clerk_user_id')
    .in('clerk_user_id', eligibleIds)
    .gte('created_at', twoHrsAgo.toISOString())
    .in('mood', ['wired', 'bright'])

  const wiredUsers = new Set((moodRows ?? []).map(r => r.clerk_user_id))

  // Focus session > 90 min that ended in the last 2 hours
  const { data: focusRows } = await supabase
    .from('focus_sessions')
    .select('clerk_user_id, actual_duration, ended_at')
    .in('clerk_user_id', eligibleIds)
    .gte('ended_at', twoHrsAgo.toISOString())

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
