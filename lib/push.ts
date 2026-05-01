import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Lazy VAPID init — called at runtime only, not during build
function initVapid() {
  const email   = process.env.VAPID_EMAIL!
  const subject = email.startsWith('mailto:') ? email : `mailto:${email}`
  webpush.setVapidDetails(
    subject,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface PushPayload {
  title: string
  body:  string
  url?:  string
  test?: boolean  // if true, service worker shows notification even when app is open
}

// ── Web push (PWA) ─────────────────────────────────────────────────────────────
async function sendWebPush(userId: string, payload: PushPayload, supabase: ReturnType<typeof getServiceClient>) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('clerk_user_id', userId)

  if (!subs || subs.length === 0) return

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Clean up expired/invalid subscriptions (410 Gone or 404 Not Found)
  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    }
  })

  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }
}

// ── Expo push (iOS + Android) ──────────────────────────────────────────────────
async function sendExpoPush(userId: string, payload: PushPayload, supabase: ReturnType<typeof getServiceClient>) {
  const { data: rows } = await supabase
    .from('expo_push_tokens')
    .select('token')
    .eq('clerk_user_id', userId)

  if (!rows || rows.length === 0) return

  const messages = rows.map((row) => ({
    to:    row.token,
    title: payload.title,
    body:  payload.body,
    data:  payload.url ? { url: payload.url } : {},
    sound: 'default' as const,
  }))

  // Expo Push API accepts up to 100 messages per request
  const chunks: typeof messages[] = []
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100))
  }

  const responses = await Promise.allSettled(
    chunks.map((chunk) =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(chunk),
      }).then((r) => r.json())
    )
  )

  // Clean up tokens that are no longer valid (DeviceNotRegistered)
  const invalidTokens: string[] = []
  responses.forEach((res, chunkIdx) => {
    if (res.status !== 'fulfilled') return
    const data = res.value?.data as Array<{ status: string; details?: { error?: string } }> | undefined
    data?.forEach((item, itemIdx) => {
      if (item.status === 'error' && item.details?.error === 'DeviceNotRegistered') {
        invalidTokens.push(chunks[chunkIdx][itemIdx].to)
      }
    })
  })

  if (invalidTokens.length > 0) {
    await supabase.from('expo_push_tokens').delete().in('token', invalidTokens)
  }
}

// ── Public: send to all channels for a user ────────────────────────────────────
export async function sendPushToUser(userId: string, payload: PushPayload) {
  initVapid()
  const supabase = getServiceClient()

  // Fire web push and Expo push in parallel — neither blocks the other
  await Promise.allSettled([
    sendWebPush(userId, payload, supabase),
    sendExpoPush(userId, payload, supabase),
  ])
}
