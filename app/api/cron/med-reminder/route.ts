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

  // Current UTC hour — meds with scheduled_time matching this hour get a nudge
  // scheduled_time is stored as "HH:MM" (24h). We match on hour only.
  const nowUtc = new Date()
  const currentHour = nowUtc.getUTCHours()
  const hourStr = String(currentHour).padStart(2, '0')   // "08", "14", etc.

  const supabase = getServiceClient()

  // Fetch names + meds in parallel
  const [profilesRes, medsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('clerk_user_id, display_name')
      .in('clerk_user_id', userIds),
    supabase
      .from('medications')
      .select('clerk_user_id, name, scheduled_time')
      .in('clerk_user_id', userIds)
      .like('scheduled_time', `${hourStr}:%`),
  ])

  const meds = medsRes.data
  if (!meds || meds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const nameMap: Record<string, string> = {}
  for (const p of profilesRes.data ?? []) {
    nameMap[p.clerk_user_id] = p.display_name ?? 'there'
  }

  // Group by user so we send one notification per user (even with multiple meds)
  const byUser: Record<string, string[]> = {}
  for (const med of meds) {
    if (!byUser[med.clerk_user_id]) byUser[med.clerk_user_id] = []
    byUser[med.clerk_user_id].push(med.name)
  }

  const results = await Promise.allSettled(
    Object.entries(byUser).map(([userId, names]) => {
      const name = nameMap[userId] ?? 'there'
      const medList = names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      return sendPushToUser(userId, {
        title: `Hey ${name} — med check 💊`,
        body: `Time for ${medList}. Lumi's got you.`,
        url: '/me/medication',
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: Object.keys(byUser).length })
}
