import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Shift a YYYY-MM-DD date string into UTC day bounds using tzOffset (minutes behind UTC)
function getDayBounds(date: string, tzOffset: number) {
  // Local midnight = UTC midnight + tzOffset minutes
  const start = new Date(`${date}T00:00:00.000Z`)
  start.setUTCMinutes(start.getUTCMinutes() + tzOffset)
  const end = new Date(start)
  end.setUTCHours(end.getUTCHours() + 23)
  end.setUTCMinutes(end.getUTCMinutes() + 59)
  end.setUTCSeconds(59)
  end.setUTCMilliseconds(999)
  return { start, end }
}

const MOOD_META: Record<string, { label: string; color: string }> = {
  drained: { label: 'Drained', color: '#8FAAE0' },
  low:     { label: 'Low',     color: '#B8AECC' },
  okay:    { label: 'Okay',    color: '#C8A030' },
  bright:  { label: 'Bright',  color: '#C86040' },
  wired:   { label: 'Wired',   color: '#B86090' },
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url      = new URL(req.url)
  const date     = url.searchParams.get('date') // YYYY-MM-DD
  const tzOffset = parseInt(url.searchParams.get('tzOffset') ?? '0', 10)

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const safeOffset = isNaN(tzOffset) ? 0 : tzOffset
  const { start, end } = getDayBounds(date, safeOffset)

  const supabase = getServiceClient()

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [moodsRes, capturesRes, completedRes, focusRes, medsRes] = await Promise.all([
    // All mood logs on this date (ordered asc for duration logic)
    supabase
      .from('mood_logs')
      .select('mood, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true }),

    // All captures logged on this date
    supabase
      .from('captures')
      .select('id')
      .eq('clerk_user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),

    // Completed tasks on this date
    supabase
      .from('captures')
      .select('text')
      .eq('clerk_user_id', userId)
      .eq('tag', 'task')
      .eq('completed', true)
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString()),

    // Focus sessions on this date
    supabase
      .from('focus_sessions')
      .select('actual_duration, task_label')
      .eq('clerk_user_id', userId)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString()),

    // Medication logs on this date
    supabase
      .from('medication_logs')
      .select('id')
      .eq('clerk_user_id', userId)
      .gte('taken_at', start.toISOString())
      .lte('taken_at', end.toISOString()),
  ])

  // ── One Focus (optional table) ─────────────────────────────────────────────
  let oneFocus: { task: string; completed: boolean } | null = null
  try {
    const { data: ofData, error: ofError } = await supabase
      .from('one_focus')
      .select('task, completed')
      .eq('clerk_user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (!ofError && ofData) {
      oneFocus = { task: ofData.task, completed: ofData.completed ?? false }
    }
  } catch {
    // table may not exist — silently skip
  }

  // ── Mood: longest-held logic ───────────────────────────────────────────────
  let moodResult: { value: string; label: string; color: string } | null = null
  const moodLogs = moodsRes.data ?? []

  if (moodLogs.length === 1) {
    const m = MOOD_META[moodLogs[0].mood]
    if (m) moodResult = { value: moodLogs[0].mood, label: m.label, color: m.color }
  } else if (moodLogs.length > 1) {
    const durations: Record<string, number> = {}
    for (let i = 0; i < moodLogs.length; i++) {
      const s = new Date(moodLogs[i].created_at).getTime()
      const e = i < moodLogs.length - 1
        ? new Date(moodLogs[i + 1].created_at).getTime()
        : end.getTime()
      durations[moodLogs[i].mood] = (durations[moodLogs[i].mood] ?? 0) + (e - s)
    }
    const topMood = Object.entries(durations).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (topMood) {
      const m = MOOD_META[topMood]
      if (m) moodResult = { value: topMood, label: m.label, color: m.color }
    }
  }

  // ── Focus stats ────────────────────────────────────────────────────────────
  const focusSessions = focusRes.data ?? []
  const focusMinutes  = Math.round(
    focusSessions.reduce((s, f) => s + (f.actual_duration ?? 0), 0) / 60
  )
  const longestSession = focusSessions.sort(
    (a, b) => (b.actual_duration ?? 0) - (a.actual_duration ?? 0)
  )[0]
  const focusTaskLabel: string | null = longestSession?.task_label ?? null

  // ── Completed tasks ────────────────────────────────────────────────────────
  const completedTasks  = (completedRes.data ?? []).map(c => c.text as string)
  const totalCaptures   = (capturesRes.data ?? []).length
  const medsTaken       = (medsRes.data ?? []).length > 0

  // ── Lumi reflection (Haiku, fast) ─────────────────────────────────────────
  let reflection = ''
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5'),
      maxOutputTokens: 60,
      prompt: `Generate a single warm, shame-free sentence (under 20 words) reflecting on this person's day as Lumi, an ADHD companion. Day data: mood=${moodResult?.value ?? 'unknown'}, tasks completed=${completedTasks.length}, focus minutes=${focusMinutes}, captures=${totalCaptures}. No "you did great". Just a genuine warm observation. No quotes around the sentence.`,
    })
    reflection = text.trim()
  } catch {
    // Reflection is best-effort — don't fail the whole request
    reflection = 'Every day you show up is one that matters.'
  }

  // ── Response ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    date,
    mood: moodResult,
    tasks: {
      completed: completedTasks.length,
      list: completedTasks,
    },
    captures: { total: totalCaptures },
    focus: {
      sessions: focusSessions.length,
      minutes:  focusMinutes,
      taskLabel: focusTaskLabel,
    },
    meds: { taken: medsTaken },
    oneFocus,
    reflection,
  })
}
