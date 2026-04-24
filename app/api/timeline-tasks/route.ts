import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — today's scheduled tasks
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const now = new Date()
  // Use local date boundaries (tasks scheduled for "today" in user's local date)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const { data } = await supabase
    .from('captures')
    .select('id, text, scheduled_at, completed')
    .eq('clerk_user_id', userId)
    .gte('scheduled_at', startOfDay)
    .lt('scheduled_at', endOfDay)
    .order('scheduled_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

// POST — create a new scheduled task
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, scheduled_at } = await req.json()
  if (!content?.trim() || !scheduled_at) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('captures')
    .insert({
      clerk_user_id: userId,
      text:          content.trim(),
      tag:           'task',        // makes it eligible for One Focus
      scheduled_at,
      completed:     false,
    })
    .select('id, text, scheduled_at, completed')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — toggle complete
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Support toggling completion OR rescheduling (or both)
  const updates: Record<string, unknown> = {}
  if (body.completed   !== undefined) updates.completed   = body.completed
  if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('captures')
    .update(updates)
    .eq('id', id)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
