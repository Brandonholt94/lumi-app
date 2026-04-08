import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { buildLumiSystemPrompt } from '@/lib/ai/lumi-prompt'
import { detectCrisis, CRISIS_RESPONSE, DISTRESS_CONTEXT } from '@/lib/ai/crisis-detection'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function flagCrisis(
  userId: string,
  tier: 'CRISIS' | 'DISTRESS',
  matched: string | null,
  messageExcerpt: string
) {
  try {
    const supabase = getServiceClient()
    await supabase.from('crisis_flags').insert({
      clerk_user_id: userId,
      tier,
      matched_phrase: matched,
      message_excerpt: messageExcerpt.slice(0, 200),
    })
  } catch {
    // Silently fail — never let logging break the user experience
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, userContext } = await req.json()

  // Get the last user message for crisis detection
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string; content: string }) => m.role === 'user')
  const lastContent: string = lastUserMessage?.content ?? ''

  // ── Crisis pre-filter ──────────────────────────────────────
  const crisis = detectCrisis(lastContent)

  if (crisis.tier === 'CRISIS') {
    // Flag for internal record — do not surface to user
    await flagCrisis(userId, 'CRISIS', crisis.matched, lastContent)

    // Return warm crisis response directly — do not call Claude
    // Stream it character by character to match the chat UX
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const char of CRISIS_RESPONSE) {
          controller.enqueue(encoder.encode(char))
        }
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Build system prompt — inject distress context if needed
  const baseSystem = buildLumiSystemPrompt(userContext)
  const system =
    crisis.tier === 'DISTRESS'
      ? `${baseSystem}\n\n## CURRENT MESSAGE ALERT\n${DISTRESS_CONTEXT}`
      : baseSystem

  // Flag distress for internal record (async, don't await)
  if (crisis.tier === 'DISTRESS') {
    flagCrisis(userId, 'DISTRESS', crisis.matched, lastContent)
  }

  // ── Normal Lumi response ───────────────────────────────────
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
