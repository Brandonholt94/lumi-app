import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { buildLumiSystemPrompt } from '@/lib/ai/lumi-prompt'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, userContext } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: buildLumiSystemPrompt(userContext),
    messages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
