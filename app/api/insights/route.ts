import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getWeekBounds() {
  const now = new Date()
  const dow = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { monday, sunday } = getWeekBounds()

  const [capturesRes, moodsRes, focusRes, profileRes] = await Promise.all([
    supabase
      .from('captures')
      .select('tag, created_at')
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
  ])

  const captures     = capturesRes.data  ?? []
  const moods        = moodsRes.data     ?? []
  const focusSessions = focusRes.data    ?? []
  const plan         = profileRes.data?.plan ?? 'free'

  // Capture stats
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
    captures: { total: captures.length, byTag, byDay, busiestDay },
    moods: moodDays,
    focus: {
      sessions: focusSessions.length,
      minutes:  Math.round(focusSessions.reduce((s, f) => s + (f.actual_duration ?? 0), 0) / 60),
    },
  })
}
