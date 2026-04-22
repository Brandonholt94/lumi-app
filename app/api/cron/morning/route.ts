import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 8am in their local timezone
  const userIds = await getEligibleUsersForLocalHour('morning_checkin', 8)

  const results = await Promise.allSettled(
    userIds.map(userId =>
      sendPushToUser(userId, {
        title: 'Good morning ☀️',
        body: "How's your brain feeling today? Lumi's here when you're ready.",
        url: '/today',
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: userIds.length })
}
