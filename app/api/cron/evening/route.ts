import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 7pm in their local timezone
  const userIds = await getEligibleUsersForLocalHour('evening_checkin', 19)

  const results = await Promise.allSettled(
    userIds.map(userId =>
      sendPushToUser(userId, {
        title: 'Evening check-in 🌙',
        body: "How did today go? Take a breath — Lumi's here for your wind-down.",
        url: '/chat',
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: userIds.length })
}
