import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 9am Sunday in their local timezone
  const userIds = await getEligibleUsersForLocalHour('weekly_report', 9)

  const results = await Promise.allSettled(
    userIds.map(userId =>
      sendPushToUser(userId, {
        title: 'Your Weekly Brain Report 📊',
        body: 'See how your week looked — wins, moods, and what your brain was up to.',
        url: '/insights',
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: userIds.length })
}
