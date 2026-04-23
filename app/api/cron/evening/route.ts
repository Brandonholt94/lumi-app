import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 7pm in their local timezone
  const userIds = await getEligibleUsersForLocalHour('evening_checkin', 19)
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

  // Fetch completed One Focus tasks for today (to celebrate wins)
  const { data: completedFocus } = await supabase
    .from('captures')
    .select('clerk_user_id, text')
    .in('clerk_user_id', userIds)
    .eq('is_one_focus', true)
    .eq('completed', true)
    .gte('created_at', `${today}T00:00:00`)

  const completedMap: Record<string, string> = {}
  for (const t of completedFocus ?? []) {
    completedMap[t.clerk_user_id] = t.text
  }

  const results = await Promise.allSettled(
    userIds.map(userId => {
      const name = nameMap[userId] ?? 'there'
      const completedTask = completedMap[userId]

      const title = `Evening check-in 🌙`
      const body = completedTask
        ? `${name}, you finished "${completedTask}" today. That's a real win. How are you feeling?`
        : `How did today go, ${name}? Take a breath — Lumi's here for your wind-down.`

      return sendPushToUser(userId, { title, body, url: '/chat' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: userIds.length })
}
