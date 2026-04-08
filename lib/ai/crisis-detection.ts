// ─────────────────────────────────────────────────────────────
// CRISIS DETECTION — Pre-filter before Claude
// Runs on every incoming message. Three tiers:
//   CRISIS   — explicit self-harm or suicide, directed at self
//   DISTRESS — heavy hopelessness language, possible escalation
//   NONE     — normal, including venting/frustration
// ─────────────────────────────────────────────────────────────

export type CrisisTier = 'CRISIS' | 'DISTRESS' | 'NONE'

export interface CrisisResult {
  tier: CrisisTier
  matched: string | null  // the phrase that triggered, for logging
}

// Phrases that indicate genuine self-directed crisis
// Must be specific enough to avoid false positives on venting
const CRISIS_PATTERNS: RegExp[] = [
  /\bi (want|need|am going) to (kill|end|hurt) (my)?self\b/i,
  /\b(kill|end|take) my (own )?life\b/i,
  /\bsuicid(e|al|ally)\b/i,
  /\bself.?harm(ing)?\b/i,
  /\bcut(ting)? (my)?self\b/i,
  /\bdon'?t want to (be here|live|exist|wake up) (anymore|any more)\b/i,
  /\b(thinking|thought) about (ending|killing) (it|my life|myself)\b/i,
  /\bnot worth (living|being alive|it) anymore\b/i,
  /\b(better|easier) (off|if i was) (dead|gone|not here)\b/i,
  /\bwish i (was|were|wasn'?t) (dead|never born|gone)\b/i,
  /\bwant(ing)? to die\b/i,
  /\bplan(ning)? to (kill|hurt|end) (my)?self\b/i,
]

// Phrases indicating significant distress that may escalate
// Lumi will respond with extra warmth and surface resources gently
const DISTRESS_PATTERNS: RegExp[] = [
  /\b(feel|feeling|felt) (completely |totally )?(hopeless|worthless|empty|nothing|numb)\b/i,
  /\bcan'?t (go on|do this anymore|keep going|take (it|this) anymore)\b/i,
  /\bno (point|reason|purpose) (in|to) (living|anything|going on)\b/i,
  /\bgiving up\b/i,
  /\bfalling apart\b/i,
  /\bbreaking point\b/i,
  /\bcan'?t (do|handle|take) (this|it|life|anything) anymore\b/i,
  /\bwhat'?s the point\b/i,
]

// Phrases that look alarming but are clearly venting — do NOT escalate
const VENTING_OVERRIDES: RegExp[] = [
  /\b(kill|murder|destroy|strangle|fight) (my boss|my coworker|my teacher|him|her|them|my partner|my ex)\b/i,
  /\bi('?m going to)? kill (it|this|the day|this workout|this presentation)\b/i,
  /\bkill(ing)? (the vibe|the mood|me softly|two birds)\b/i,
  /\bdying (of|from) (laughter|embarrassment|boredom|cringe)\b/i,
  /\bdead (inside )?from (laughing|cringe|embarrassment)\b/i,
]

export function detectCrisis(message: string): CrisisResult {
  // Check venting overrides first — if it matches, it's safe
  for (const pattern of VENTING_OVERRIDES) {
    if (pattern.test(message)) {
      return { tier: 'NONE', matched: null }
    }
  }

  // Check CRISIS tier
  for (const pattern of CRISIS_PATTERNS) {
    const match = message.match(pattern)
    if (match) {
      return { tier: 'CRISIS', matched: match[0] }
    }
  }

  // Check DISTRESS tier
  for (const pattern of DISTRESS_PATTERNS) {
    const match = message.match(pattern)
    if (match) {
      return { tier: 'DISTRESS', matched: match[0] }
    }
  }

  return { tier: 'NONE', matched: null }
}

// The warm crisis response — returned directly, never passed to Claude
// Lumi stays present, surfaces resources, does not pretend to be equipped
export const CRISIS_RESPONSE = `What you're carrying right now sounds really heavy — and I want you to know I hear you.

This is beyond what I'm able to hold with you, and I don't want to pretend otherwise. There are people who are specifically trained to be with you in this moment.

**Please reach out right now:**
- **988 Suicide & Crisis Lifeline** — call or text **988** (US, 24/7)
- **Crisis Text Line** — text **HOME** to **741741** (free, 24/7)
- **Emergency services** — call **911** if you're in immediate danger

I'm not going anywhere. But please let someone trained for this be with you first.`

// Distress response prefix — prepended to Lumi's normal response
// Signals to Lumi to be in crisis-adjacent mode without a hard handoff
export const DISTRESS_CONTEXT = `The user's message contains language suggesting significant emotional distress — hopelessness or feeling at a breaking point. Do not attempt to problem-solve or give advice. Lead entirely with warmth and presence. Validate deeply before anything else. At the end of your response, gently surface that if things feel really dark, support is available at 988 or by texting HOME to 741741 — frame it as care, not alarm.`
