import { auth } from '@clerk/nextjs/server'
import { isCalendarConnected, getConnectedEmail } from '@/lib/google-calendar'
import { isMicrosoftConnected, getMicrosoftEmail } from '@/lib/microsoft-calendar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [googleConnected, microsoftConnected] = await Promise.all([
    isCalendarConnected(userId),
    isMicrosoftConnected(userId),
  ])

  const [googleEmail, microsoftEmail] = await Promise.all([
    googleConnected    ? getConnectedEmail(userId)  : Promise.resolve(null),
    microsoftConnected ? getMicrosoftEmail(userId)  : Promise.resolve(null),
  ])

  return NextResponse.json({
    google:    { connected: googleConnected,    email: googleEmail },
    microsoft: { connected: microsoftConnected, email: microsoftEmail },
  })
}
