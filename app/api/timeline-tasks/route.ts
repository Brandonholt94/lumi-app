import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateTaskEmoji, prependEmoji } from '@/lib/ai/task-emoji'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — scheduled tasks for a given date (defaults to today)
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url     = new URL(req.url)
  const dateStr = url.searchParams.get('date') // YYYY-MM-DD

  let startOfDay: string, endOfDay: string
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    startOfDay = new Date(y, m - 1, d).toISOString()
    endOfDay   = new Date(y, m - 1, d + 1).toISOString()
  } else {
    const now = new Date()
    startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  }

  const supabase = getServiceClient()

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

  // Auto-generate an emoji unless the user already prepended one via the picker.
  // Helper returns '' on failure or if text already starts with an emoji — never blocks.
  const emoji = await generateTaskEmoji(content)
  const finalText = prependEmoji(emoji, content)

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('captures')
    .insert({
      clerk_user_id: userId,
      text:          finalText,
      tag:           'task',        // makes it eligible for One Focus
      scheduled_at,
      completed:     false,
    })
    .select('id, text, scheduled_at, completed')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove a task
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('captures')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
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
