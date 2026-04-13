import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/medications/log?date=2026-04-13
// Returns medication_ids that have been taken on a given date
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('medication_logs')
    .select('medication_id')
    .eq('clerk_user_id', userId)
    .eq('taken_date', date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(r => r.medication_id))
}

// POST /api/medications/log
// Body: { medication_id, date, taken }
// taken=true → insert log, taken=false → delete log
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { medication_id, date, taken } = await req.json()
  if (!medication_id || !date) {
    return NextResponse.json({ error: 'medication_id and date required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  if (taken) {
    const { error } = await supabase
      .from('medication_logs')
      .upsert({ clerk_user_id: userId, medication_id, taken_date: date }, { onConflict: 'clerk_user_id,medication_id,taken_date' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('clerk_user_id', userId)
      .eq('medication_id', medication_id)
      .eq('taken_date', date)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
