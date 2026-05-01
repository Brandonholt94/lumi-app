import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getUpcomingEvents } from '@/lib/google-calendar'
import { getMicrosoftUpcomingEvents } from '@/lib/microsoft-calendar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Gate: Companion only — non-companion gets empty array (personal tasks still work)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('clerk_user_id', userId)
    .single()

  if (profile?.plan !== 'companion') {
    return NextResponse.json([])
  }

  const url     = new URL(req.url)
  const dateStr = url.searchParams.get('date') // YYYY-MM-DD — if provided, filter to that day
  const hours   = parseInt(url.searchParams.get('hours') ?? '24')

  // Determine the target day window
  let targetStart: Date, targetEnd: Date
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    targetStart = new Date(y, m - 1, d)
    targetEnd   = new Date(y, m - 1, d + 1)
  } else {
    targetStart = new Date(); targetStart.setHours(0, 0, 0, 0)
    targetEnd   = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000)
  }

  // Fetch enough hours to cover the target day
  const hoursNeeded = Math.max(hours, Math.ceil((targetEnd.getTime() - Date.now()) / 3_600_000) + 1)

  const [googleEvents, microsoftEvents] = await Promise.all([
    getUpcomingEvents(userId, hoursNeeded),
    getMicrosoftUpcomingEvents(userId, hoursNeeded),
  ])

  // ── Demo seed events (screenshot / marketing) ──────────────────
  // Remove this block once real calendar is connected.
  // Uses setUTCHours(localH + 4) so EDT (UTC-4) clients see the right local time.
  function demoAt(localH: number, localM = 0, daysAhead = 0, durMins = 60) {
    const s = new Date()
    s.setUTCDate(s.getUTCDate() + daysAhead)
    s.setUTCHours(localH + 4, localM, 0, 0)   // EDT = UTC-4
    const e = new Date(s.getTime() + durMins * 60000)
    return { start: s.toISOString(), end: e.toISOString() }
  }
  // Events are timed so they don't overlap with each other or the orange personal tasks
  const demoEvents = userId === 'user_3CfxWowG4VrDVqtvA2Achy1KNc6' ? [
    // Today
    { id: 'demo-1',  title: 'Lumi team standup',          ...demoAt(9,   0, 0, 30),  source: 'google' },
    { id: 'demo-2',  title: 'Design review w/ Jake',      ...demoAt(11,  0, 0, 60),  source: 'google' },
    { id: 'demo-3',  title: 'Dentist appointment',        ...demoAt(14,  0, 0, 60),  source: 'google' },
    { id: 'demo-4',  title: 'Investor call — Seed round', ...demoAt(16,  0, 0, 45),  source: 'google' },
    { id: 'demo-5',  title: 'Dinner with Sarah',          ...demoAt(19,  0, 0, 90),  source: 'google' },
    // Tomorrow
    { id: 'demo-6',  title: '1:1 with co-founder',        ...demoAt(9,   0, 1, 45),  source: 'google' },
    { id: 'demo-7',  title: 'Product demo — beta users',  ...demoAt(11,  0, 1, 60),  source: 'google' },
    { id: 'demo-8',  title: 'Therapy session',            ...demoAt(14,  0, 1, 50),  source: 'google' },
    { id: 'demo-9',  title: 'Advisory board call',        ...demoAt(16,  30, 1, 60), source: 'google' },
    // Day after
    { id: 'demo-10', title: 'Coffee w/ Maya',             ...demoAt(8,   30, 2, 45), source: 'google' },
    { id: 'demo-11', title: 'Sprint planning',            ...demoAt(10,  0,  2, 90), source: 'google' },
    { id: 'demo-12', title: 'Doctor check-up',            ...demoAt(13,  30, 2, 45), source: 'google' },
    { id: 'demo-13', title: 'Launch prep call',           ...demoAt(15,  30, 2, 60), source: 'google' },
  ] : []
  // ── End demo seed ──────────────────────────────────────────────

  // Merge, filter to target day, sort by start time
  const events = [...googleEvents, ...microsoftEvents, ...demoEvents]
    .filter(e => {
      const t = new Date(e.start).getTime()
      return t >= targetStart.getTime() && t < targetEnd.getTime()
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return NextResponse.json({ events })
}
