import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createAnthropic } from '@ai-sdk/anthropic'
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
  const mood = (searchParams.get('mood') ?? null) as 'foggy' | 'okay' | 'wired' | 'drained' | null

  const supabase = getServiceClient()

  // Fetch incomplete task-tagged captures, ordered oldest first (most emotional weight)
  const { data: tasks, error } = await supabase
    .from('captures')
    .select('id, text, tag, created_at')
    .eq('clerk_user_id', userId)
    .eq('tag', 'task')
    .eq('completed', false)
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // No tasks — return empty state
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({
      capture_id: null,
      task: null,
      lumi_message: "Nothing in the queue yet. Add something to Brain Dump and I'll pick your one thing.",
    })
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = buildFocusSelectionPrompt({
    mood,
    tasks,
    hour: new Date().getHours(),
  })

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt,
      maxOutputTokens: 300,
    })

    // Parse the JSON response from Claude
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
