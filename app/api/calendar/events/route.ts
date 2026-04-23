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
