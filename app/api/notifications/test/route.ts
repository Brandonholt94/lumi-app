import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'

// POST — send a test push notification to the current user's device(s).
// Used by the notifications settings page to verify the push pipeline.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await sendPushToUser(userId, {
      title: 'Lumi is here 👋',
      body: 'Notifications are working. You\'ll hear from me when it matters.',
      url: '/today',
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push failed'
    console.error('[notifications/test]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
