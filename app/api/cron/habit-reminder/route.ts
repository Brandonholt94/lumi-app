import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Remind users at 6pm local time if they have habits they haven't logged today.
// Only fires if the user has habits set up AND hasn't completed all of them.
export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userIds = await getEligibleUsersForLocalHour('habit_reminder', 18)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // Fetch all habits and today's logs for eligible users
  const [habitsRes, logsRes, profilesRes] = await Promise.all([
    supabase
      .from('habits')
      .select('clerk_user_id, id, name')
      .in('clerk_user_id', userIds),
    supabase
      .from('habit_logs')
      .select('clerk_user_id, habit_id')
      .in('clerk_user_id', userIds)
      .eq('log_date', today),
    supabase
      .from('profiles')
      .select('clerk_user_id, display_name')
      .in('clerk_user_id', userIds),
  ])

  const nameMap: Record<string, string> = {}
  for (const p of profilesRes.data ?? []) {
    nameMap[p.clerk_user_id] = p.display_name ?? 'there'
  }

  // Group habits and logs by user
  const habitsByUser: Record<string, { id: string; name: string }[]> = {}
  for (const h of habitsRes.data ?? []) {
    if (!habitsByUser[h.clerk_user_id]) habitsByUser[h.clerk_user_id] = []
    habitsByUser[h.clerk_user_id].push({ id: h.id, name: h.name })
  }

  const loggedByUser: Record<string, Set<string>> = {}
  for (const l of logsRes.data ?? []) {
    if (!loggedByUser[l.clerk_user_id]) loggedByUser[l.clerk_user_id] = new Set()
    loggedByUser[l.clerk_user_id].add(l.habit_id)
  }

  // Only send to users who have at least one unlogged habit
  const eligibleIds = userIds.filter(id => {
    const habits = habitsByUser[id] ?? []
    if (habits.length === 0) return false
    const logged = loggedByUser[id] ?? new Set()
    return habits.some(h => !logged.has(h.id))
  })

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const results = await Promise.allSettled(
    eligibleIds.map(userId => {
      const name = nameMap[userId] ?? 'there'
      const habits = habitsByUser[userId] ?? []
      const logged = loggedByUser[userId] ?? new Set()
      const remaining = habits.filter(h => !logged.has(h.id)).map(h => h.name)

      const title = `Evening habits, ${name} 🌿`
      const body = remaining.length === 1
        ? `Just "${remaining[0]}" left for today. You've almost got it.`
        : `${remaining.length} habits still waiting. Quick wins before the day ends.`

      return sendPushToUser(userId, { title, body, url: '/today' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
