import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'
import { getUpcomingEvents } from '@/lib/google-calendar'
import { getMicrosoftUpcomingEvents } from '@/lib/microsoft-calendar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Warn users 15 minutes before their next calendar event — in their local timezone.
// Runs every hour; only users with a connected calendar receive this.
export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Find all users who have a Google or Microsoft calendar connected
  const [googleConns, microsoftConns] = await Promise.all([
    supabase.from('calendar_tokens').select('clerk_user_id').eq('provider', 'google'),
    supabase.from('calendar_tokens').select('clerk_user_id').eq('provider', 'microsoft'),
  ])

  const allConnectedIds = [
    ...new Set([
      ...(googleConns.data ?? []).map(r => r.clerk_user_id),
      ...(microsoftConns.data ?? []).map(r => r.clerk_user_id),
    ])
  ]

  if (allConnectedIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Only notify users who have push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')
    .in('clerk_user_id', allConnectedIds)

  const subscribedIds = [...new Set((subRows ?? []).map(r => r.clerk_user_id))]
  if (subscribedIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const now = new Date()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const sent: string[] = []

  await Promise.allSettled(
    subscribedIds.map(async (userId) => {
      // Fetch upcoming events from all connected providers
      const [googleEvents, microsoftEvents] = await Promise.all([
        getUpcomingEvents(userId, 2).catch(() => []),
        getMicrosoftUpcomingEvents(userId, 2).catch(() => []),
      ])

      const events = [...googleEvents, ...microsoftEvents].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )

      // Find the first event starting within the 15-minute window
      const upcoming = events.find(e => {
        if (e.allDay) return false
        const startMs = new Date(e.start).getTime()
        const minsUntil = (startMs - now.getTime()) / 1000 / 60
        return minsUntil >= 0 && minsUntil <= 15
      })

      if (!upcoming) return

      const minsUntil = Math.round((new Date(upcoming.start).getTime() - now.getTime()) / 1000 / 60)
      const timeLabel = minsUntil <= 1 ? 'now' : `in ${minsUntil} min`

      await sendPushToUser(userId, {
        title: `⏰ ${upcoming.title}`,
        body: `Starting ${timeLabel}. Time to wrap up and transition.`,
        url: '/today',
      })

      sent.push(userId)
    })
  )

  return NextResponse.json({ sent: sent.length, total: subscribedIds.length })
}
