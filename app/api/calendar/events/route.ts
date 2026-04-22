import { auth } from '@clerk/nextjs/server'
import { getUpcomingEvents } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const hours = parseInt(url.searchParams.get('hours') ?? '24')

  const events = await getUpcomingEvents(userId, hours)
  return NextResponse.json({ events })
}
