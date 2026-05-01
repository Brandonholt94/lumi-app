import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sleep log reminder — fires at 10pm local for users who haven't logged sleep today.
// The goal is to catch people before they crash so yesterday's sleep quality gets captured.

const TARGET_HOUR = 22

const COPY = [
  {
    title: 'Before you crash 🌙',
    body:  'How did sleep go last night? Logging takes 10 seconds and helps Lumi support you better.',
  },
  {
    title: 'Quick sleep check ✨',
    body:  'Haven\'t logged sleep yet today. Even a rough estimate helps Lumi understand your energy.',
  },
  {
    title: 'Night check-in 💙',
    body:  'How\'s your sleep been? Lumi uses this to know when to take it easy with you.',
  },
  {
    title: 'Rest log reminder 🛌',
    body:  'Quick one — how did last night go? It only takes a second.',
  },
]

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userIds = await getEligibleUsersForLocalHour('evening_checkin', TARGET_HOUR)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const today    = new Date().toISOString().slice(0, 10)

  // Only send to users who haven't logged sleep today
  const { data: sleepRows } = await supabase
    .from('sleep_logs')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)
    .eq('log_date', today)

  const alreadyLogged = new Set((sleepRows ?? []).map(r => r.clerk_user_id))
  const needsReminder = userIds.filter(id => !alreadyLogged.has(id))

  if (needsReminder.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const dayOfYear = Math.floor(Date.now() / 86_400_000)

  const results = await Promise.allSettled(
    needsReminder.map((userId, i) => {
      const { title, body } = COPY[(i + dayOfYear) % COPY.length]
      return sendPushToUser(userId, { title, body, url: '/me' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: needsReminder.length })
}
