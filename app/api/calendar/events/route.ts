import { auth } from '@clerk/nextjs/server'
import { getUpcomingEvents } from '@/lib/google-calendar'
import { getMicrosoftUpcomingEvents } from '@/lib/microsoft-calendar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const hours = parseInt(url.searchParams.get('hours') ?? '24')

  const [googleEvents, microsoftEvents] = await Promise.all([
    getUpcomingEvents(userId, hours),
    getMicrosoftUpcomingEvents(userId, hours),
  ])

  // Merge and sort by start time
  const events = [...googleEvents, ...microsoftEvents].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  return NextResponse.json({ events })
}
