import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsers, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userIds = await getEligibleUsers('med_reminder')
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()

  // Fetch profiles (display_name + timezone) and all scheduled meds in parallel
  const [profilesRes, medsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('clerk_user_id, display_name, timezone')
      .in('clerk_user_id', userIds),
    supabase
      .from('medications')
      .select('clerk_user_id, name, scheduled_time')
      .in('clerk_user_id', userIds)
      .not('scheduled_time', 'is', null),
  ])

  const allMeds = medsRes.data ?? []
  if (allMeds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const now = new Date()

  // Build a per-user map of profile info
  const profileMap: Record<string, { name: string; timezone: string }> = {}
  for (const p of profilesRes.data ?? []) {
    profileMap[p.clerk_user_id] = {
      name:     p.display_name ?? 'there',
      timezone: p.timezone     ?? 'America/New_York',
    }
  }

  // For each user, compute their current local hour and match against scheduled_time
  const byUser: Record<string, string[]> = {}

  for (const med of allMeds) {
    const profile = profileMap[med.clerk_user_id]
    if (!profile || !med.scheduled_time) continue

    // Get current local hour for this user's timezone
    let localHour: number
    try {
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        hour:     'numeric',
        hour12:   false,
        timeZone: profile.timezone,
      }).format(now)
      localHour = parseInt(localHourStr) % 24
    } catch {
      continue
    }

    // scheduled_time is stored as "HH:MM" (24h) in the user's local time
    const scheduledHour = parseInt(med.scheduled_time.split(':')[0])
    if (localHour !== scheduledHour) continue

    if (!byUser[med.clerk_user_id]) byUser[med.clerk_user_id] = []
    byUser[med.clerk_user_id].push(med.name)
  }

  if (Object.keys(byUser).length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const results = await Promise.allSettled(
    Object.entries(byUser).map(([userId, names]) => {
      const name    = profileMap[userId]?.name ?? 'there'
      const medList = names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      return sendPushToUser(userId, {
        title: `Hey ${name} — med check 💊`,
        body:  `Time for ${medList}. Lumi's got you.`,
        url:   '/me/medication',
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: Object.keys(byUser).length })
}
