import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 11am in their local timezone
  const userIds = await getEligibleUsersForLocalHour('focus_reminder', 11)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Only nudge users who have incomplete tasks today
  const { data: taskRows } = await supabase
    .from('captures')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)
    .eq('completed', false)
    .in('tag', ['task', 'reminder'])
    .gte('created_at', todayStart.toISOString())

  const usersWithTasks = [...new Set((taskRows ?? []).map(r => r.clerk_user_id))]
  if (usersWithTasks.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const results = await Promise.allSettled(
    usersWithTasks.map(userId =>
      sendPushToUser(userId, {
        title: 'Tasks waiting 🎯',
        body: 'Your focus list is ready. Want Lumi to help you pick one thing?',
        url: '/today',
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: usersWithTasks.length })
}
