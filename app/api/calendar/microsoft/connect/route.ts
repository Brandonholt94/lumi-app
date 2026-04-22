import { auth } from '@clerk/nextjs/server'
import { buildMicrosoftOAuthUrl } from '@/lib/microsoft-calendar'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const origin      = new URL(req.url).origin
  const redirectUri = `${origin}/api/calendar/microsoft/callback`
  redirect(buildMicrosoftOAuthUrl(redirectUri))
}
