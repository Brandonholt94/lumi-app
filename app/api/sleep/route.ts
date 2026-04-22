import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function localDateStr(tzOffset: number): string {
  const d = new Date(Date.now() - tzOffset * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export type SleepLog = {
  id: string
  log_date: string
  bedtime_hour: number
  wake_hour: number
  quality: 'great' | 'okay' | 'rough' | null
  duration: number   // computed: hours of sleep
}

function addDuration(row: { bedtime_hour: number; wake_hour: number; [key: string]: unknown }): SleepLog {
  const dur = row.wake_hour >= row.bedtime_hour
    ? row.wake_hour - row.bedtime_hour
    : 24 - row.bedtime_hour + row.wake_hour
  return { ...(row as Omit<SleepLog, 'duration'>), duration: Math.round(dur * 2) / 2 }
}

// GET /api/sleep?tzOffset=XXX
// Returns { today: SleepLog | null, history: SleepLog[] (last 7, newest first) }
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tzOffset = parseInt(new URL(req.url).searchParams.get('tzOffset') ?? '0', 10)
  const today    = localDateStr(tzOffset)
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('id, log_date, bedtime_hour, wake_hour, quality')
    .eq('clerk_user_id', userId)
    .order('log_date', { ascending: false })
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows   = (data ?? []).map(addDuration)
  const todayLog = rows.find(r => r.log_date === today) ?? null
  const history  = rows.filter(r => r.log_date !== today).slice(0, 7)

  return NextResponse.json({ today: todayLog, history })
}

// POST /api/sleep
// Upserts one sleep log for today
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { bedtime_hour, wake_hour, quality, tzOffset = 0 } = body

  if (typeof bedtime_hour !== 'number' || typeof wake_hour !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const log_date = localDateStr(tzOffset)
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert(
      {
        clerk_user_id: userId,
        log_date,
        bedtime_hour,
        wake_hour,
        quality: quality ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id,log_date' }
    )
    .select('id, log_date, bedtime_hour, wake_hour, quality')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(addDuration(data))
}
