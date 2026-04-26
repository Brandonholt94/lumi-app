import { NextResponse } from 'next/server'
import { verifyCronAuth, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Invite users to brain dump at 9pm local time if they haven't captured anything
// in the last 6 hours. ADHD brains run hot at night — this is a high-value moment
// to catch thoughts before they spiral or get lost.
// Gates on all subscribed users (no separate pref — brain dump is always welcome).
export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const now = new Date()
  const TARGET_HOUR = 21 // 9pm local

  // Get all users with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')

  if (!subRows || subRows.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const allSubscribedIds = [...new Set(subRows.map(s => s.clerk_user_id))]

  // Fetch timezones to filter to users where it's currently 9pm local
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('clerk_user_id, timezone')
    .in('clerk_user_id', allSubscribedIds)

  const atNinePm = (profileRows ?? [])
    .filter(p => {
      const tz = p.timezone || 'America/New_York'
      try {
        const localHourStr = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric', hour12: false, timeZone: tz,
        }).format(now)
        return (parseInt(localHourStr) % 24) === TARGET_HOUR
      } catch { return false }
    })
    .map(p => p.clerk_user_id)

  if (atNinePm.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // Exclude users who've already captured something in the last 6 hours
  const { data: recentCaptures } = await supabase
    .from('captures')
    .select('clerk_user_id')
    .in('clerk_user_id', atNinePm)
    .gte('created_at', sixHoursAgo)

  const recentlyActiveIds = new Set((recentCaptures ?? []).map(r => r.clerk_user_id))
  const eligibleIds = atNinePm.filter(id => !recentlyActiveIds.has(id))

  if (eligibleIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const COPY = [
    { title: 'Brain still going? 🌙',        body: 'Dump it all here. Make sense of it tomorrow.' },
    { title: "What's still on your mind? 💭", body: "Late-night thoughts deserve a safe place. Lumi's listening." },
    { title: 'End-of-day brain dump ✨',       body: "Get it out of your head and into Lumi. You'll sleep better." },
    { title: 'Still spinning? 🌀',             body: 'Write it down. Lumi will hold it while you rest.' },
  ]

  const dayOfYear = Math.floor(Date.now() / 86_400_000)

  const results = await Promise.allSettled(
    eligibleIds.map((userId, i) => {
      const { title, body } = COPY[(i + dayOfYear) % COPY.length]
      return sendPushToUser(userId, { title, body, url: '/capture' })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: eligibleIds.length })
}
