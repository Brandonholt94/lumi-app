import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

// Detects if a string starts with an emoji (extended pictographic Unicode)
const STARTS_WITH_EMOJI = /^\p{Extended_Pictographic}/u
const HAS_EMOJI = /\p{Extended_Pictographic}/u

/**
 * Generates a single contextual emoji for a task using Claude Haiku.
 * Returns just the emoji (e.g. "💊") or empty string on failure / unsuitable input.
 *
 * Cheap call — Haiku is plenty smart for picking an emoji and costs ~10x less than Sonnet.
 * Should never block task creation: callers must handle empty-string gracefully.
 */
export async function generateTaskEmoji(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Already starts with an emoji — respect the user's pick, don't double up
  if (STARTS_WITH_EMOJI.test(trimmed)) return ''

  try {
    const { text: raw } = await generateText({
      model: anthropic('claude-haiku-4.5'),
      prompt: `Pick the single most fitting emoji for this task. Reply with ONLY the emoji, nothing else — no words, no quotes, no explanation.

Task: "${trimmed}"`,
      maxOutputTokens: 10,
    })

    const cleaned = raw.trim()

    // Verify it's actually an emoji (Claude sometimes returns text)
    if (!HAS_EMOJI.test(cleaned)) return ''

    // Extract just the first emoji char(s) — strip anything else
    const match = cleaned.match(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*/u)
    return match?.[0] ?? ''
  } catch {
    return ''
  }
}

/**
 * Prepends an emoji to text with a space separator. No-op if emoji is empty.
 */
export function prependEmoji(emoji: string, text: string): string {
  if (!emoji) return text.trim()
  return `${emoji} ${text.trim()}`
}
