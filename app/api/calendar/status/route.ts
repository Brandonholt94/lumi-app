import { auth } from '@clerk/nextjs/server'
import { isCalendarConnected, getConnectedEmail } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connected = await isCalendarConnected(userId)
  const email     = connected ? await getConnectedEmail(userId) : null

  return NextResponse.json({ connected, email })
}
