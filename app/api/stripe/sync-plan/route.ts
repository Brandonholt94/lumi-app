import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_CORE_MONTHLY_PRICE_ID!]:      'core',
    [process.env.STRIPE_CORE_ANNUAL_PRICE_ID!]:       'core',
    [process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID!]: 'companion',
    [process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID!]:  'companion',
  }
  return map[priceId] ?? 'core'
}

// POST /api/stripe/sync-plan
// Reads the user's active Stripe subscription and updates their profile plan.
// Useful when the webhook missed an event (e.g. during development).
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
    return NextResponse.json({ error: 'No Stripe customer on file. Complete checkout first.' }, { status: 400 })
  }

  // List active/trialing subscriptions for this customer
  const subs = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'all',
    limit: 5,
  })

  const active = subs.data.find(s => ['active', 'trialing'].includes(s.status))

  if (!active) {
    // No active sub — downgrade to core (no free tier)
    await supabase.from('profiles')
      .update({ plan: 'core', updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId)
    return NextResponse.json({ plan: 'core', synced: true })
  }

  const priceId = active.items.data[0]?.price?.id
  const plan = priceId ? planFromPriceId(priceId) : 'core'

  await supabase.from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)

  return NextResponse.json({ plan, synced: true, status: active.status })
}
