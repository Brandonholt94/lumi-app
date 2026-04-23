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
  const today = new Date().toISOString().slice(0, 10)

  // Fetch display names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, display_name')
    .in('clerk_user_id', userIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    nameMap[p.clerk_user_id] = p.display_name ?? 'there'
  }

  // Fetch One Focus tasks (incomplete) for today
  const { data: focusTasks } = await supabase
    .from('captures')
    .select('clerk_user_id, text')
    .in('clerk_user_id', userIds)
    .eq('is_one_focus', true)
    .eq('completed', false)
    .gte('created_at', `${today}T00:00:00`)

  const focusMap: Record<string, string> = {}
  for (const t of focusTasks ?? []) {
    focusMap[t.clerk_user_id] = t.text
  }

  // Also check users with any incomplete tasks (for users without a One Focus)
  const { data: taskRows } = await supabase
    .from('captures')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)
    .eq('completed', false)
    .in('tag', ['task', 'reminder'])
    .gte('created_at', `${today}T00:00:00`)

  const usersWithTasks = new Set((taskRows ?? []).map(r => r.clerk_user_id))

  // Only nudge users who have something to work on
  const eligibleIds = userIds.filter(id => focusMap[id] || usersWithTasks.has(id))
  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const results = await Promise.allSettled(
    eligibleIds.map(userId => {
      const name = nameMap[userId] ?? 'there'
      const focus = focusMap[userId]

      const title = focus
        ? `How's "${focus.slice(0, 30)}${focus.length > 30 ? '…' : ''}" going? 🎯`
        : `Midday check-in 🎯`

      const body = focus
        ? `Hey ${name} — you picked "${focus}" as your focus. Want Lumi to help you start?`
        : `Hey ${name}, your focus list is ready. Want Lumi to help you pick one thing?`

      return sendPushToUser(userId, { title, body, url: '/today' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
