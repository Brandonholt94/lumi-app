import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  // Return defaults if no row yet — these mirror the onboarding seed values
  return NextResponse.json(data ?? {
    morning_checkin: true,
    focus_reminder:  true,
    med_reminder:    false,
    evening_checkin: true,
    weekly_report:   true,
    habit_reminder:  false,
    morning_hour:    8,
    evening_hour:    19,
  })
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await req.json()
  const supabase = getServiceClient()

  await supabase.from('notification_preferences').upsert(
    { clerk_user_id: userId, ...prefs, updated_at: new Date().toISOString() },
    { onConflict: 'clerk_user_id' }
  )

  return NextResponse.json({ ok: true })
}
