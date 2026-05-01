function getLocalToday(timezone: string): Date {
  const localStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  return new Date(localStr + 'T00:00:00')
}

function nextWeekday(from: Date, target: number): Date {
  const d = new Date(from)
  let diff = target - d.getDay()
  if (diff <= 0) diff += 7
  d.setDate(d.getDate() + diff)
  return d
}

function toISO(d: Date): string {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function toLabel(d: Date, today: Date): string {
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff < 7) return `this ${d.toLocaleDateString('en-US', { weekday: 'long' })}`
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function parseDateSuggestion(
  text: string,
  timezone = 'America/New_York'
): { date: string; label: string } | null {
  const lower = text.toLowerCase()
  const today = getLocalToday(timezone)

  // today / tonight / this morning|afternoon|evening
  if (/\b(today|tonight|this (morning|afternoon|evening))\b/.test(lower)) {
    return { date: toISO(today), label: 'today' }
  }

  // tomorrow
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    return { date: toISO(d), label: 'tomorrow' }
  }

  // in X days
  const inDays = lower.match(/\bin (\d+) days?\b/)
  if (inDays) {
    const n = parseInt(inDays[1])
    if (n >= 1 && n <= 60) {
      const d = new Date(today); d.setDate(d.getDate() + n)
      return { date: toISO(d), label: toLabel(d, today) }
    }
  }

  // next week / in a week
  if (/\b(next week|in a week)\b/.test(lower)) {
    const d = new Date(today); d.setDate(d.getDate() + 7)
    return { date: toISO(d), label: toLabel(d, today) }
  }

  // this weekend / weekend
  if (/\bthis weekend\b|\bweekend\b/.test(lower)) {
    const d = nextWeekday(today, 6)
    return { date: toISO(d), label: `this Saturday` }
  }

  // day names — check "next monday" before bare "monday"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < dayNames.length; i++) {
    if (new RegExp(`\\b(next\\s+)?${dayNames[i]}\\b`).test(lower)) {
      const d = nextWeekday(today, i)
      return { date: toISO(d), label: toLabel(d, today) }
    }
  }

  // month + day: "May 5", "May 5th", "5th of May"
  const monthNames = [
    'january','february','march','april','may','june',
    'july','august','september','october','november','december',
  ]
  for (let m = 0; m < monthNames.length; m++) {
    const re1 = new RegExp(`\\b${monthNames[m]}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`)
    const re2 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthNames[m]}\\b`)
    const match = lower.match(re1) ?? lower.match(re2)
    if (match) {
      const day = parseInt(match[1])
      if (day >= 1 && day <= 31) {
        const yr = today.getFullYear()
        const d = new Date(yr, m, day)
        if (d < today) d.setFullYear(yr + 1)
        return {
          date: toISO(d),
          label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        }
      }
    }
  }

  return null
}
