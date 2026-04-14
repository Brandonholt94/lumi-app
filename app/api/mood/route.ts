import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/mood — fetch most recent mood log for today
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('mood_logs')
    .select('mood, created_at')
    .eq('clerk_user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return NextResponse.json({ mood: null })
  return NextResponse.json({ mood: data.mood })
}

// POST /api/mood — persist a mood selection
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mood } = await req.json()
  const validMoods = ['drained', 'low', 'okay', 'bright', 'wired']
  if (!mood || !validMoods.includes(mood)) {
    return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { error } = await supabase.from('mood_logs').insert({
    clerk_user_id: userId,
    mood,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
