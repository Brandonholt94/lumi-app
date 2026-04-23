import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { redirect } from 'next/navigation'
import WelcomeScreen from './_components/WelcomeScreen'

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_CORE_MONTHLY_PRICE_ID    ?? '']: 'core',
  [process.env.STRIPE_CORE_ANNUAL_PRICE_ID     ?? '']: 'core',
  [process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID ?? '']: 'companion',
  [process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID  ?? '']: 'companion',
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; session_id?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = await searchParams
  const upgraded  = params.upgraded === 'true'
  const sessionId = params.session_id

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── If returning from Stripe checkout, write plan directly ──
  if (upgraded && sessionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      })

      let plan = 'core'
      const sub = session.subscription as Stripe.Subscription | null
      if (sub) {
        const priceId = sub.items.data[0]?.price?.id
        if (priceId && PRICE_TO_PLAN[priceId]) {
          plan = PRICE_TO_PLAN[priceId]
        }
      }

      const customerId = session.customer as string | null

      await supabase.from('profiles').upsert({
        clerk_user_id:      userId,
        plan,
        ...(customerId ? { stripe_customer_id: customerId } : {}),
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' })

      console.log('[welcome] plan written directly from session', { plan, sessionId })
    } catch (err) {
      console.error('[welcome] failed to write plan from session', err)
    }
  }

  // ── Fetch fresh profile after any plan write above ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, biggest_struggle, tone_preference, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/onboarding')

  return <WelcomeScreen name={profile.display_name ?? 'there'} plan={profile.plan ?? 'core'} />
}
