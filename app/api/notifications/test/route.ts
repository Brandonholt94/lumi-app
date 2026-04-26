import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — send a test push notification to the current user's device(s).
// Returns 400 if no subscription is found (instead of silently succeeding).
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check subscription exists before attempting to send
  const supabase = getServiceClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint')
    .eq('clerk_user_id', userId)

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: 'No subscription found — tap "Re-register notifications" below and try again.' },
      { status: 400 }
    )
  }

  try {
    await sendPushToUser(userId, {
      title: 'Lumi is here 👋',
      body: "Notifications are working. You'll hear from me when it matters.",
      url: '/today',
      test: true,  // bypasses the "app is open" suppression in the service worker
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push failed'
    console.error('[notifications/test]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
