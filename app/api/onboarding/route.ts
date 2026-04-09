import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/onboarding — upsert profile with onboarding answers
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    display_name,
    adhd_identity,
    biggest_struggle,
    hardest_time,
    support_situation,
    tone_preference,
  } = body

  const supabase = getServiceClient()
  const { error } = await supabase.from('profiles').upsert({
    clerk_user_id:           userId,
    display_name,
    adhd_identity,
    biggest_struggle,
    hardest_time,
    support_situation,
    tone_preference,
    onboarding_completed_at: new Date().toISOString(),
    updated_at:              new Date().toISOString(),
  }, { onConflict: 'clerk_user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// GET /api/onboarding — check if onboarding is complete
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed_at, display_name')
    .eq('clerk_user_id', userId)
    .single()

  return NextResponse.json({
    completed: !!data?.onboarding_completed_at,
    display_name: data?.display_name ?? null,
  })
}
