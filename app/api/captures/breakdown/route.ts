import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const STARTER_BREAKDOWN_LIMIT = 3

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { text } = await req.json()
  if (!text) return new Response('Missing text', { status: 400 })

  const supabase = getServiceClient()

  // ── Fetch plan ──────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('clerk_user_id', userId)
    .single()

  const plan = profile?.plan ?? 'free'
  const isStarter = plan === 'free' || plan === 'starter'

  // ── Starter: enforce 3 breakdowns/day ──────────────────────
  if (isStarter) {
    const today = new Date().toISOString().slice(0, 10)

    const { data: usage } = await supabase
      .from('daily_usage')
      .select('breakdowns')
      .eq('clerk_user_id', userId)
      .eq('date', today)
      .single()

    const used = usage?.breakdowns ?? 0

    if (used >= STARTER_BREAKDOWN_LIMIT) {
      return Response.json(
        { error: 'Daily breakdown limit reached', limitReached: true, limit: STARTER_BREAKDOWN_LIMIT },
        { status: 429 }
      )
    }
  }

  // ── Generate subtasks ───────────────────────────────────────
  const { text: result } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    messages: [
      {
        role: 'user',
        content: `Break down this task for an adult with ADHD into 3-6 concrete subtasks.

Task: "${text}"

Rules:
- Each subtask should take 5-30 minutes
- Be specific and actionable, not vague
- Start with the smallest or easiest step first
- Include realistic time estimates
- Frame gently — avoid commanding language

Return ONLY a valid JSON array, no explanation, no markdown:
[{"text": "subtask description", "minutes": 15}, ...]`,
      },
    ],
    maxOutputTokens: 400,
  })

  try {
    const clean = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const subtasks = JSON.parse(clean)

    // ── Starter: increment daily usage counter ──────────────
    if (isStarter) {
      const today = new Date().toISOString().slice(0, 10)
      // `used` is already fetched above — safe to increment directly
      await supabase.from('daily_usage').upsert(
        { clerk_user_id: userId, date: today, breakdowns: (usage?.breakdowns ?? 0) + 1 },
        { onConflict: 'clerk_user_id,date' }
      )
    }

    return Response.json({ subtasks, plan })
  } catch {
    return Response.json({ subtasks: [] }, { status: 500 })
  }
}
