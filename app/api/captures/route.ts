import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { sendPushToUser } from '@/lib/push'
import { generateTaskEmoji, prependEmoji } from '@/lib/ai/task-emoji'
import { parseDateSuggestion } from '@/lib/parse-date'

// Use service role to bypass RLS — we filter by clerk_user_id manually
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/captures — fetch all captures for the current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/captures — create a new capture
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { text, tag, timezone } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  // Auto-emoji ONLY for task-tagged captures. Brain dump thoughts/feelings stay clean.
  let finalText = text.trim()
  if (tag === 'task') {
    const emoji = await generateTaskEmoji(text)
    finalText = prependEmoji(emoji, text)
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('captures')
    .insert({
      clerk_user_id: userId,
      text: finalText,
      tag: tag ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const suggestion = parseDateSuggestion(text.trim(), timezone ?? 'America/New_York')
  return NextResponse.json({
    ...data,
    ...(suggestion ? { suggested_date: suggestion.date, suggested_label: suggestion.label } : {}),
  }, { status: 201 })
}

// PATCH /api/captures — update a capture (completed, addressed)
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const supabase = getServiceClient()

  // If pinning as One Focus, clear any existing pin first
  if (updates.is_one_focus === true) {
    await supabase
      .from('captures')
      .update({ is_one_focus: false })
      .eq('clerk_user_id', userId)
      .eq('is_one_focus', true)
  }

  const { data, error } = await supabase
    .from('captures')
    .update(updates)
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select()
    .single()

  // Stamp pinned_at separately — tolerates column not existing yet (migration 009)
  if (!error && updates.is_one_focus === true) {
    await supabase
      .from('captures')
      .update({ one_focus_pinned_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
  }

  // Stamp completed_at when marking done — tolerates column not existing yet
  if (!error && updates.completed === true) {
    await supabase
      .from('captures')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
  }

  // 🎉 One Focus celebration push — fires when the user completes their pinned focus task
  if (!error && updates.completed === true && data?.is_one_focus === true) {
    const taskName = data.text ?? 'your focus task'
    void sendPushToUser(userId, {
      title: 'You did it! 🎉',
      body: `"${taskName.slice(0, 50)}${taskName.length > 50 ? '…' : ''}" — that's a real win. How are you feeling?`,
      url: '/chat',
    }).catch(() => {})
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/captures?id=xxx — delete a capture
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('captures')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
