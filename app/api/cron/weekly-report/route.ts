import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsers } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userIds = await getEligibleUsers('weekly_report')

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
