import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — fetch habits + today's logs
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, emoji, position')
      .eq('clerk_user_id', userId)
      .order('position'),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('clerk_user_id', userId)
      .eq('log_date', today),
  ])

  const loggedIds = new Set((logsRes.data ?? []).map((r: { habit_id: string }) => r.habit_id))
  const habits = (habitsRes.data ?? []).map((h: { id: string; name: string; emoji: string; position: number }) => ({
    ...h,
    done: loggedIds.has(h.id),
  }))

  return NextResponse.json({ habits })
}

// POST — create a new habit (max 3)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, emoji } = await req.json() as { name: string; emoji?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supabase = getServiceClient()

  // Enforce max 3
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Maximum 3 habits allowed' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      clerk_user_id: userId,
      name: name.trim(),
      emoji: emoji ?? '✦',
      position: count ?? 0,
    })
    .select('id, name, emoji, position')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: { ...data, done: false } })
}

// DELETE — remove a habit
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getServiceClient()
  await supabase.from('habits').delete().eq('id', id).eq('clerk_user_id', userId)

  return NextResponse.json({ ok: true })
}
