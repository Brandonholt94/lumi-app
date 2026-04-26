import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — returns whether the current user has at least one push subscription in the DB.
// Used by the notifications settings page to show registration status.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint')
    .eq('clerk_user_id', userId)

  if (error) {
    console.error('[notifications/status]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hasSubscription = (subs?.length ?? 0) > 0
  const endpoint = hasSubscription ? subs![0].endpoint : null

  return NextResponse.json({ hasSubscription, endpoint, count: subs?.length ?? 0 })
}
