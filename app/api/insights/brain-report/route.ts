import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || profile.plan === 'free') {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)

  const [capturesRes, moodsRes, focusRes] = await Promise.all([
    supabase
      .from('captures')
      .select('text, tag, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', monday.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('mood_logs')
      .select('mood, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', monday.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('focus_sessions')
      .select('duration_minutes, completed')
      .eq('clerk_user_id', userId)
      .gte('started_at', monday.toISOString()),
  ])

  const captures      = capturesRes.data  ?? []
  const moods         = moodsRes.data     ?? []
  const focusSessions = focusRes.data     ?? []

  const byTag = { task: 0, idea: 0, worry: 0, reminder: 0 }
  for (const c of captures) {
    const k = c.tag as keyof typeof byTag
    if (k && k in byTag) byTag[k]++
  }

  const moodFreq: Record<string, number> = {}
  for (const m of moods) moodFreq[m.mood] = (moodFreq[m.mood] ?? 0) + 1
  const dominantMood = Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const focusMinutes = focusSessions.reduce((s, f) => s + (f.duration_minutes ?? 0), 0)

  const sampleCaptures = captures
    .slice(0, 10)
    .map(c => `- [${c.tag ?? 'untagged'}] ${c.text}`)
    .join('\n')

  const prompt = `You are Lumi, a warm and deeply understanding AI companion built for adults with ADHD.

Write a Weekly Brain Report for this user. It's a short personal narrative — 3 paragraphs, around 150 words. Reflect on their week using the data below.

Lumi's voice rules:
- Warm, specific, human. Never clinical.
- Celebrate small wins. Never shame.
- Speak directly to the user ("you", "your brain").
- Never use the word "productivity", "just", or "chatbot".
- No bullet points. No headers. Pure prose.

WEEK DATA:
- Captures total: ${captures.length}
- Tasks: ${byTag.task} | Ideas: ${byTag.idea} | Worries: ${byTag.worry} | Reminders: ${byTag.reminder}
- Mood check-ins: ${moods.length}${dominantMood ? ` (most common: ${dominantMood})` : ''}
- Focus sessions: ${focusSessions.length} (${focusMinutes} min total)

Sample captures this week (for context, do not quote directly):
${sampleCaptures || '(none yet)'}

Lead with something specific and human. End with one grounding observation for next week.`

  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt,
      maxOutputTokens: 400,
    })
    return NextResponse.json({ report: text.trim() })
  } catch (err) {
    console.error('[brain-report] generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
