import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Nudge users at noon local time if they haven't set a One Focus task today.
// Task initiation paralysis is the #1 ADHD pain point — this is a gentle invite,
// not a reminder that they've failed.
export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only nudge users who have focus_reminder enabled and it's noon local time
  const userIds = await getEligibleUsersForLocalHour('focus_reminder', 12)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // Find users who already have a One Focus set today — exclude them
  const { data: hasFocus } = await supabase
    .from('captures')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)
    .eq('is_one_focus', true)
    .gte('created_at', `${today}T00:00:00`)

  const alreadyHasFocusIds = new Set((hasFocus ?? []).map(r => r.clerk_user_id))
  const eligibleIds = userIds.filter(id => !alreadyHasFocusIds.has(id))

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Fetch display names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, display_name')
    .in('clerk_user_id', eligibleIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    nameMap[p.clerk_user_id] = p.display_name ?? 'there'
  }

  const COPY = [
    (name: string) => ({
      title: `Hey ${name} — what's the one thing? 🎯`,
      body: 'Pick one task and let Lumi help you start. Just one.',
    }),
    (name: string) => ({
      title: 'Midday check-in 🌤️',
      body: `${name}, what would make today feel like a win? Lumi can help you pick.`,
    }),
    (name: string) => ({
      title: 'One thing, ${name} 💛',
      body: 'You don\'t have to do everything. Just pick one. Lumi\'s here.',
    }),
  ]

  const dayOfWeek = new Date().getDay()

  const results = await Promise.allSettled(
    eligibleIds.map((userId, i) => {
      const copyFn = COPY[(i + dayOfWeek) % COPY.length]
      const name = nameMap[userId] ?? 'there'
      const { title, body } = copyFn(name)
      return sendPushToUser(userId, { title, body, url: '/today' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
