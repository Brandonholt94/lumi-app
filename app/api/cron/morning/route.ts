import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForPreferredHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 8am in their local timezone
  const userIds = await getEligibleUsersForPreferredHour('morning_checkin', 'morning_hour', 8)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // Fetch display names for personalisation
  const { data: profiles } = await supabase
    .from('profiles')
    .select('clerk_user_id, display_name')
    .in('clerk_user_id', userIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    nameMap[p.clerk_user_id] = p.display_name ?? 'there'
  }

  // Fetch each user's One Focus task for today
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

  const GREETINGS = [
    (name: string) => `Morning, ${name} ☀️`,
    (name: string) => `Hey ${name} — new day, fresh start ✨`,
    (name: string) => `Good morning, ${name} 🌅`,
  ]

  const results = await Promise.allSettled(
    userIds.map(userId => {
      const name = nameMap[userId] ?? 'there'
      const focus = focusMap[userId]
      const greetFn = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
      const body = focus
        ? `How's your brain feeling? Today's focus: "${focus}" — Lumi's here when you're ready.`
        : `How's your brain feeling today? Lumi's here when you're ready.`

      return sendPushToUser(userId, {
        title: greetFn(name),
        body,
        url: '/today',
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: userIds.length })
}
