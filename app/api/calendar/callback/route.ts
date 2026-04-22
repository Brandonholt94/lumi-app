import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCode, fetchGoogleEmail } from '@/lib/google-calendar'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const url  = new URL(req.url)
  const code = url.searchParams.get('code')
  if (!code) redirect('/me/calendar?error=no_code')

  const origin      = url.origin
  const redirectUri = `${origin}/api/calendar/callback`

  const tokens = await exchangeCode(code!, redirectUri)
  if (tokens.error) {
    console.error('[calendar/callback] token exchange error:', tokens.error)
    redirect('/me/calendar?error=token_exchange')
  }

  const expiry      = new Date(Date.now() + tokens.expires_in * 1000)
  const googleEmail = await fetchGoogleEmail(tokens.access_token)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from('calendar_tokens')
    .upsert({
      clerk_user_id: userId,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry:  expiry.toISOString(),
      google_email:  googleEmail,
      updated_at:    new Date().toISOString(),
    })

  redirect('/me/calendar?connected=true')
}
