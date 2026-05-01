import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Register an Expo push token for this user/device
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, platform } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { error } = await supabase.from('expo_push_tokens').upsert(
    {
      clerk_user_id: userId,
      token,
      platform: platform ?? 'ios',
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'token' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Remove an Expo push token (user revoked permission or signed out)
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = getServiceClient()
  await supabase
    .from('expo_push_tokens')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('token', token)

  return NextResponse.json({ ok: true })
}
