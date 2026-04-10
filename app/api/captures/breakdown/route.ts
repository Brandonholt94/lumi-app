import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { auth } from '@clerk/nextjs/server'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { text } = await req.json()
  if (!text) return new Response('Missing text', { status: 400 })

  const { text: result } = await generateText({
    model: anthropic('claude-haiku-4.5-20251001'),
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
    return Response.json({ subtasks })
  } catch {
    return Response.json({ subtasks: [] }, { status: 500 })
  }
}
