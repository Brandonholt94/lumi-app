import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { buildOAuthUrl } from '@/lib/google-calendar'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  // Gate: Core + Companion only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('clerk_user_id', userId)
    .single()

  const plan = profile?.plan ?? 'free'
  if (plan === 'free' || plan === 'starter') {
    redirect('/me/subscription')
  }

  const origin      = new URL(req.url).origin
  const redirectUri = `${origin}/api/calendar/callback`
  redirect(buildOAuthUrl(redirectUri))
}
