import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/your-day
// Returns: tasks with a time_block + unblocked tasks for the tray + hardestTime
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  // Tray window: last 14 days so older tasks aren't invisible
  const trayFrom = new Date()
  trayFrom.setDate(trayFrom.getDate() - 14)

  const [blockedRes, trayRes, profileRes] = await Promise.all([
    // All tasks with a time_block assigned (any tag, including null-tagged)
    supabase
      .from('captures')
      .select('id, text, tag, notes, time_block, completed, created_at')
      .eq('clerk_user_id', userId)
      .or('tag.eq.task,tag.is.null')
      .not('time_block', 'is', null)
      .order('created_at', { ascending: true }),

    // Unblocked, incomplete tasks — any tag:task or untagged, last 14 days
    supabase
      .from('captures')
      .select('id, text, tag, notes, time_block, completed, created_at')
      .eq('clerk_user_id', userId)
      .or('tag.eq.task,tag.is.null')
      .is('time_block', null)
      .eq('completed', false)
      .gte('created_at', trayFrom.toISOString())
      .order('created_at', { ascending: false })
      .limit(30),

    // Profile for hardest_time personalisation
    supabase
      .from('profiles')
      .select('hardest_time')
      .eq('clerk_user_id', userId)
      .maybeSingle(),
  ])

  return NextResponse.json({
    blocked:     blockedRes.data ?? [],
    tray:        trayRes.data    ?? [],
    hardestTime: profileRes.data?.hardest_time ?? null,
  })
}
