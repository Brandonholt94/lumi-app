import { anthropic } from '@ai-sdk/anthropic'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { buildFocusSelectionPrompt } from '@/lib/ai/focus-prompt'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    started_at,
    ended_at,
    planned_duration,
    actual_duration,
    completed,
    task_label      = null,
    ambient_sound   = 'off',
    pauses          = 0,
    thoughts_captured = 0,
  } = body

  const supabase = getServiceClient()
  const { error } = await supabase.from('focus_sessions').insert({
    clerk_user_id: userId,
    started_at,
    ended_at,
    planned_duration,
    actual_duration,
    completed,
    task_label,
    ambient_sound,
    pauses,
    thoughts_captured,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mood = (searchParams.get('mood') ?? null) as 'drained' | 'low' | 'okay' | 'bright' | 'wired' | null
  const bypassPin = searchParams.get('bypass_pin') === '1'

  const supabase = getServiceClient()

  // Check for a user-pinned focus first (skip if user asked for something else today)
  let pinnedId: string | null = null
  if (!bypassPin) {
    const { data: pinned } = await supabase
      .from('captures')
      .select('id, text, one_focus_pinned_at')
      .eq('clerk_user_id', userId)
      .eq('is_one_focus', true)
      .eq('completed', false)
      .maybeSingle()

    if (pinned) {
      // Auto-reset stale pins — if pinned on a previous calendar day, quietly clear it.
      // Zero shame: the task just disappears. If it still matters, they'll re-add it.
      const pinnedDate = pinned.one_focus_pinned_at
        ? new Date(pinned.one_focus_pinned_at).toDateString()
        : new Date().toDateString()
      const isStale = pinnedDate !== new Date().toDateString()

      if (isStale) {
        await supabase
          .from('captures')
          .update({ is_one_focus: false })
          .eq('id', pinned.id)
        // Fall through to AI selection for today
      } else {
        const daysPinned = pinned.one_focus_pinned_at
          ? Math.floor((Date.now() - new Date(pinned.one_focus_pinned_at).getTime()) / 86_400_000)
          : 0
        return NextResponse.json({
          capture_id: pinned.id,
          task: pinned.text,
          lumi_message: "You picked this one. Let's make it happen.",
          days_pinned: daysPinned,
        })
      }
    }
  } else {
    // Get the pinned task id so we can exclude it from the bypass results
    const { data: pinned } = await supabase
      .from('captures')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('is_one_focus', true)
      .maybeSingle()
    pinnedId = pinned?.id ?? null
  }

  // Fetch incomplete task-tagged captures, ordered oldest first (most emotional weight)
  // Exclude the pinned task if bypassing so Claude picks something genuinely different
  let query = supabase
    .from('captures')
    .select('id, text, tag, created_at')
    .eq('clerk_user_id', userId)
    .eq('tag', 'task')
    .eq('completed', false)
    .order('created_at', { ascending: true })
    .limit(20)

  if (pinnedId) query = query.neq('id', pinnedId)

  const { data: tasks, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mood-aware pre-filtering — for low-energy moods, only send shortest tasks to Claude
  let filteredTasks = tasks ?? []
  if (mood === 'drained' || mood === 'low') {
    filteredTasks = [...filteredTasks]
      .sort((a, b) => a.text.length - b.text.length)
      .slice(0, 8)
  }

  // No tasks — return empty state
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({
      capture_id: null,
      task: null,
      lumi_message: "Nothing in the queue yet. Add something to Brain Dump and I'll pick your one thing.",
    })
  }

  const prompt = buildFocusSelectionPrompt({
    mood,
    tasks: filteredTasks,
    hour: new Date().getHours(),
  })

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4.6'),
      prompt,
      maxOutputTokens: 300,
    })

    const result = JSON.parse(text.trim())
    return NextResponse.json(result)
  } catch {
    // Fallback to oldest task if Claude fails
    const fallback = tasks[0]
    return NextResponse.json({
      capture_id: fallback.id,
      task: fallback.text,
      lumi_message: "This one's been waiting the longest. Want to start small and just see what happens?",
    })
  }
}
