import Stripe from 'stripe'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_MAP: Record<string, string | undefined> = {
  'core-monthly':      process.env.STRIPE_CORE_MONTHLY_PRICE_ID,
  'core-annual':       process.env.STRIPE_CORE_ANNUAL_PRICE_ID,
  'companion-monthly': process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID,
  'companion-annual':  process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID,
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/stripe/checkout
// Body: { priceKey: 'core-monthly' | 'core-annual' | 'companion-monthly' | 'companion-annual' }
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceKey } = await req.json()
  const priceId = PRICE_MAP[priceKey]
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Get user email from Clerk for prefill
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress

  // Check if user already has a Stripe customer ID stored
  const supabase = getServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('clerk_user_id', userId)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    // 7-day free trial
    subscription_data: {
      trial_period_days: 7,
      metadata: { clerk_user_id: userId },
    },
    // Pass clerk_user_id so webhook can find the right profile
    client_reference_id: userId,
    success_url: `${appUrl}/welcome?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/upgrade`,
    allow_promotion_codes: true,
  }

  // Reuse existing Stripe customer if we have one
  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id
  } else if (email) {
    sessionParams.customer_email = email
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error('[checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
