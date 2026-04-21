import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function todayRange() {
  const now  = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

// GET /api/your-day
// Returns: tasks with a time_block (any date) + today's unblocked tasks (for the tray)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { start, end } = todayRange()

  const [blockedRes, trayRes, profileRes] = await Promise.all([
    // All tasks assigned to a block (not completed)
    supabase
      .from('captures')
      .select('id, text, tag, notes, time_block, completed, created_at')
      .eq('clerk_user_id', userId)
      .in('tag', ['task'])
      .not('time_block', 'is', null)
      .order('created_at', { ascending: true }),

    // Today's unblocked tasks — available to drag in
    supabase
      .from('captures')
      .select('id, text, tag, notes, time_block, completed, created_at')
      .eq('clerk_user_id', userId)
      .in('tag', ['task'])
      .is('time_block', null)
      .eq('completed', false)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(20),

    // Profile for hardest_time personalisation
    supabase
      .from('profiles')
      .select('hardest_time')
      .eq('clerk_user_id', userId)
      .maybeSingle(),
  ])

  return NextResponse.json({
    blocked: blockedRes.data ?? [],
    tray:    trayRes.data    ?? [],
    hardestTime: profileRes.data?.hardest_time ?? null,
  })
}
