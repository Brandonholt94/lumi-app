import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/seen — returns last_seen_at, then stamps now()
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  // Read current last_seen_at before updating
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_seen_at')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  const lastSeen = profile?.last_seen_at ?? null

  // Stamp now — upsert in case profile row doesn't exist yet
  await supabase
    .from('profiles')
    .upsert(
      { clerk_user_id: userId, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' }
    )

  return NextResponse.json({ last_seen_at: lastSeen })
}
