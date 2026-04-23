import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ tag: null })

  const { text } = await req.json()
  if (!text || text.trim().length < 6) return NextResponse.json({ tag: null })

  try {
    const { text: result } = await generateText({
      model: 'anthropic/claude-haiku-4.5',
      maxOutputTokens: 10,
      prompt: `Classify this brain dump entry into exactly one category. Reply with only the word: task, idea, worry, reminder, or null.

Rules:
- task: concrete action to do ("clean", "call", "buy", "go to", "send", "book", "fix", "schedule")
- worry: emotional/anxious/uncertain language ("worried", "anxious", "stressed", "scared", "not sure", "overwhelmed", "what if")
- reminder: "remember to", "don't forget", time-based ("tomorrow", "at 3pm", "before")
- idea: creative, exploratory, hypothetical ("what if we", "it would be cool", "maybe", "I should try")
- null: too short, ambiguous, or doesn't fit cleanly

Entry: "${text.trim().slice(0, 300)}"

Reply with one word only:`,
    })

    const tag = result.trim().toLowerCase()
    const valid = ['task', 'idea', 'worry', 'reminder']
    return NextResponse.json({ tag: valid.includes(tag) ? tag : null })
  } catch {
    return NextResponse.json({ tag: null })
  }
}
