import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function planFromPriceId(priceId: string): string {
  const entries: Array<[string | undefined, string]> = [
    [process.env.STRIPE_CORE_MONTHLY_PRICE_ID,      'core'],
    [process.env.STRIPE_CORE_ANNUAL_PRICE_ID,       'core'],
    [process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID, 'companion'],
    [process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID,  'companion'],
  ]
  for (const [id, plan] of entries) {
    if (id && id === priceId) return plan
  }
  console.warn('[planFromPriceId] unrecognised priceId:', priceId)
  return 'core'
}

// POST — sync the authenticated user's plan from Stripe and update their profile.
// Call this if a user's plan shows incorrectly (e.g., shows upgrade prompt on Companion).
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, plan')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    console.warn('[sync-plan] no stripe_customer_id for user', userId)
    return NextResponse.json({ error: 'No Stripe customer on file', plan: profile?.plan ?? null }, { status: 404 })
  }

  console.log('[sync-plan] fetching subscriptions for customer', profile.stripe_customer_id)

  // Fetch all subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'all',
    limit: 10,
  })

  // Prefer active/trialing; fall back to most recent
  const best = subscriptions.data.find(s => ['active', 'trialing'].includes(s.status))
    ?? subscriptions.data[0]

  if (!best) {
    console.log('[sync-plan] no subscription found — defaulting to core', { userId })
    await supabase
      .from('profiles')
      .update({ plan: 'core', updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId)
    return NextResponse.json({ plan: 'core', synced: true })
  }

  const priceId = best.items.data[0]?.price?.id
  const plan = priceId ? planFromPriceId(priceId) : 'core'

  console.log('[sync-plan] resolved plan', { userId, priceId, plan, status: best.status, prev: profile.plan })

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)

  if (updateError) {
    console.error('[sync-plan] supabase update failed', updateError)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }

  return NextResponse.json({ plan, synced: true, status: best.status, prev: profile.plan })
}
