import { auth, currentUser } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const TOPIC_LABELS: Record<string, string> = {
  bug:      '🐛 Bug report',
  feedback: '💡 Feature idea',
  billing:  '💳 Billing question',
  other:    '💬 Something else',
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

  const user = await currentUser()
  const name  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Lumi user'
  const email = user?.emailAddresses?.[0]?.emailAddress ?? 'unknown'
  const label = TOPIC_LABELS[topic] ?? topic

  const { error } = await resend.emails.send({
    from:    'Lumi <hey@lumimind.app>',
    to:      'hey@lumimind.app',
    replyTo: email,
    subject: `${label} from ${name}`,
    text:    `From: ${name} (${email})\nTopic: ${label}\n\n${message.trim()}`,
  })

  if (error) {
    console.error('[contact] resend error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
