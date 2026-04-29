import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// "Late night" = bedtime past 1am.
// bedtime_hour is stored 0–24 (decimal). Past midnight wraps to 0–6.
// 1am bedtime = 1.0. 11pm = 23.0. So "late" = 1.0 < bedtime_hour < 6.0.
const LATE_HOUR_MIN = 1.0
const LATE_HOUR_MAX = 6.0

// Surface threshold: 2 consecutive late nights triggers the card.
const STREAK_TRIGGER = 2

// Show brain dump correlation only if it's at least 30 minutes worth of sleep.
const CORRELATION_THRESHOLD_MIN = 30

type SleepRow = {
  log_date: string
  bedtime_hour: number
  wake_hour: number
}

function durationHours(row: SleepRow): number {
  return row.wake_hour >= row.bedtime_hour
    ? row.wake_hour - row.bedtime_hour
    : 24 - row.bedtime_hour + row.wake_hour
}

function isLateNight(bedtime: number): boolean {
  return bedtime > LATE_HOUR_MIN && bedtime < LATE_HOUR_MAX
}

// Walk back from most-recent log; count run of consecutive late nights.
// Rows are already ordered newest-first.
function computeLateStreak(rows: SleepRow[]): number {
  let streak = 0
  for (const row of rows) {
    if (isLateNight(row.bedtime_hour)) streak++
    else break
  }
  return streak
}

// Was there a brain-dump-tagged capture in the evening (after 7pm) on the night before this log_date?
// log_date 2026-04-28 = woke up 2026-04-28, went to bed 2026-04-27 evening.
function eveningCaptureCountByLogDate(captures: { created_at: string }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cap of captures) {
    const created = new Date(cap.created_at)
    const hour = created.getHours()
    if (hour < 19) continue              // ignore pre-7pm captures
    // Bucket by NEXT day (the morning the user wakes up = the sleep log's date)
    const next = new Date(created)
    next.setDate(next.getDate() + 1)
    const key = next.toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function buildRecommendation(streak: number, correlationDiff: number | null): string {
  if (streak >= STREAK_TRIGGER) {
    return streak === 2
      ? "Two late nights in a row. Want me to lighten tomorrow afternoon when the crash usually hits?"
      : `${streak} late nights in a row. Want me to lighten tomorrow afternoon when the crash usually hits?`
  }
  if (correlationDiff && correlationDiff >= CORRELATION_THRESHOLD_MIN) {
    return `You sleep about ${correlationDiff} minutes longer on nights you brain dump first. Want a quick brain dump before bed tonight?`
  }
  return ''
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  // Pull last 14 nights — enough for streaks and correlation
  const { data: sleepData } = await supabase
    .from('sleep_logs')
    .select('log_date, bedtime_hour, wake_hour')
    .eq('clerk_user_id', userId)
    .order('log_date', { ascending: false })
    .limit(14)

  const rows: SleepRow[] = sleepData ?? []

  if (rows.length === 0) {
    return NextResponse.json({
      lateNightStreak: 0,
      brainDumpCorrelation: null,
      recommendation: '',
      surface: false,
    })
  }

  const lateNightStreak = computeLateStreak(rows)

  // Correlation: pull captures from the last 14 days, bucket by next-morning date
  const earliestDate = rows[rows.length - 1].log_date
  const cutoffStart = new Date(earliestDate)
  cutoffStart.setDate(cutoffStart.getDate() - 1)

  const { data: captureData } = await supabase
    .from('captures')
    .select('created_at')
    .eq('clerk_user_id', userId)
    .gte('created_at', cutoffStart.toISOString())

  const captureCounts = eveningCaptureCountByLogDate(captureData ?? [])

  let withSum   = 0, withN   = 0
  let woutSum   = 0, woutN   = 0
  for (const row of rows) {
    const hadEveningCapture = (captureCounts.get(row.log_date) ?? 0) > 0
    const dur = durationHours(row)
    if (hadEveningCapture) { withSum += dur; withN++ }
    else                   { woutSum += dur; woutN++ }
  }

  let correlationDiff: number | null = null
  if (withN >= 2 && woutN >= 2) {
    const withAvg = withSum / withN
    const woutAvg = woutSum / woutN
    correlationDiff = Math.round((withAvg - woutAvg) * 60)  // hours → minutes
    if (correlationDiff < CORRELATION_THRESHOLD_MIN) correlationDiff = null
  }

  const recommendation = buildRecommendation(lateNightStreak, correlationDiff)
  const surface = lateNightStreak >= STREAK_TRIGGER || correlationDiff !== null

  return NextResponse.json({
    lateNightStreak,
    brainDumpCorrelation: correlationDiff,
    recommendation,
    surface,
  })
}

// User accepts: "Yes please, dim things tomorrow."
// Sets low_battery_mode_until to tomorrow 11:59pm in their local time (best-effort UTC),
// which downstream APIs (focus, chat) read to soften.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { tzOffset = 0 } = body  // minutes, like Date.prototype.getTimezoneOffset

  // End of tomorrow in the user's local time, expressed as UTC instant
  const now = new Date()
  const localNow = new Date(now.getTime() - tzOffset * 60 * 1000)
  const tomorrowEnd = new Date(localNow)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
  tomorrowEnd.setHours(23, 59, 59, 999)
  const utcTomorrowEnd = new Date(tomorrowEnd.getTime() + tzOffset * 60 * 1000)

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ low_battery_mode_until: utcTomorrowEnd.toISOString() })
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ low_battery_mode_until: utcTomorrowEnd.toISOString() })
}
