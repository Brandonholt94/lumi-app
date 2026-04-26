import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — send a test push notification to the current user's device(s).
// Verbose version: surfaces every error and result from the push service.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data: subs, error: dbError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('clerk_user_id', userId)

  if (dbError) {
    return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 })
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: 'No subscription found — tap "Re-register notifications" below and try again.' },
      { status: 400 }
    )
  }

  // Init VAPID
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidEmail   = process.env.VAPID_EMAIL

  if (!vapidPublic || !vapidPrivate || !vapidEmail) {
    return NextResponse.json({ error: 'VAPID env vars missing on server' }, { status: 500 })
  }

  const subject = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate)

  const payload = JSON.stringify({
    title: 'Lumi is here 👋',
    body: "Notifications are working. You'll hear from me when it matters.",
    url: '/today',
    test: true,
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const detail = results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return { endpoint: subs[i].endpoint.slice(0, 60), statusCode: r.value.statusCode, ok: true }
    } else {
      const err = r.reason as { statusCode?: number; body?: string; message?: string }
      console.error('[notifications/test] push failed:', err.statusCode, err.body ?? err.message)
      return {
        endpoint: subs[i].endpoint.slice(0, 60),
        statusCode: err.statusCode,
        error: err.body ?? err.message,
        ok: false,
      }
    }
  })

  const allOk = detail.every(d => d.ok)
  return NextResponse.json({ ok: allOk, detail }, { status: allOk ? 200 : 500 })
}
