import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Save a push subscription for this user/device
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const supabase = getServiceClient()
  await supabase.from('push_subscriptions').upsert(
    {
      clerk_user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: 'clerk_user_id,endpoint' }
  )

  return NextResponse.json({ ok: true })
}

// Remove a push subscription (user turned off notifications on this device)
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const supabase = getServiceClient()
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}
