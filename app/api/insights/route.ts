import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// tzOffset = result of JS getTimezoneOffset() — minutes BEHIND UTC (EST = 240)
function getWeekBounds(tzOffset = 0) {
  const now = new Date()
  // Shift UTC time by the user's offset to simulate local time in UTC arithmetic
  const local = new Date(now.getTime() - tzOffset * 60 * 1000)
  const dow = local.getUTCDay() // 0=Sun
  const daysFromMon = dow === 0 ? 6 : dow - 1

  const mondayLocal = new Date(local)
  mondayLocal.setUTCDate(local.getUTCDate() - daysFromMon)
  mondayLocal.setUTCHours(0, 0, 0, 0)

  const sundayLocal = new Date(mondayLocal)
  sundayLocal.setUTCDate(mondayLocal.getUTCDate() + 6)
  sundayLocal.setUTCHours(23, 59, 59, 999)

  // Shift back to real UTC for DB queries
  const monday = new Date(mondayLocal.getTime() + tzOffset * 60 * 1000)
  const sunday = new Date(sundayLocal.getTime() + tzOffset * 60 * 1000)
  return { monday, sunday }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tzOffset = parseInt(new URL(req.url).searchParams.get('tzOffset') ?? '0', 10)
  const supabase = getServiceClient()
  const { monday, sunday } = getWeekBounds(isNaN(tzOffset) ? 0 : tzOffset)

  const [capturesRes, moodsRes, focusRes, profileRes, completedRes] = await Promise.all([
    supabase
      .from('captures')
      .select('tag, created_at, text')
      .eq('clerk_user_id', userId)
      .gte('created_at', monday.toISOString())
      .lte('created_at', sunday.toISOString()),
    supabase
      .from('mood_logs')
      .select('mood, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', monday.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('focus_sessions')
      .select('actual_duration, completed')
      .eq('clerk_user_id', userId)
      .gte('started_at', monday.toISOString()),
    supabase
      .from('profiles')
      .select('plan')
      .eq('clerk_user_id', userId)
      .single(),
    // Completed tasks: keyed off completed_at so tasks from prior weeks count
    supabase
      .from('captures')
      .select('text, completed_at')
      .eq('clerk_user_id', userId)
      .eq('completed', true)
      .eq('tag', 'task')
      .gte('completed_at', monday.toISOString())
      .lte('completed_at', sunday.toISOString()),
  ])

  const captures      = capturesRes.data  ?? []
  const moods         = moodsRes.data     ?? []
  const focusSessions = focusRes.data     ?? []
  const plan          = profileRes.data?.plan ?? 'free'
  const completedTasks = (completedRes.data ?? []).map(c => ({
    text: c.text,
    created_at: c.completed_at as string,
  }))

  // Capture stats — week captures only (for byTag / byDay activity)
  const byTag = { task: 0, idea: 0, worry: 0, reminder: 0, untagged: 0 }
  const byDay = [0, 0, 0, 0, 0, 0, 0] // Mon=0 … Sun=6

  for (const c of captures) {
    const key = c.tag as keyof typeof byTag
    if (key && key in byTag) byTag[key]++
    else byTag.untagged++
    const d = new Date(c.created_at).getDay()
    byDay[d === 0 ? 6 : d - 1]++
  }

  const maxDay      = Math.max(...byDay)
  const DAY_NAMES   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const busiestDay  = maxDay > 0 ? DAY_NAMES[byDay.indexOf(maxDay)] : null

  // Mood: last logged mood per calendar day
  const moodByDate: Record<string, string> = {}
  for (const m of moods) {
    moodByDate[m.created_at.slice(0, 10)] = m.mood
  }

  // Build 7-day mood strip starting Monday
  const moodDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    return { date, mood: moodByDate[date] ?? null }
  })

  return NextResponse.json({
    plan,
    week: {
      start: monday.toISOString().slice(0, 10),
      end:   sunday.toISOString().slice(0, 10),
    },
    captures: { total: captures.length, byTag, byDay, busiestDay, completedTasks },
    moods: moodDays,
    focus: {
      sessions: focusSessions.length,
      minutes:  Math.round(focusSessions.reduce((s, f) => s + (f.actual_duration ?? 0), 0) / 60),
    },
  })
}
