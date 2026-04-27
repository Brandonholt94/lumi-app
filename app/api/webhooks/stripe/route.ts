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
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,   'starter'],
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,    'starter'],
    [process.env.STRIPE_CORE_MONTHLY_PRICE_ID,      'core'],
    [process.env.STRIPE_CORE_ANNUAL_PRICE_ID,       'core'],
    [process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID, 'companion'],
    [process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID,  'companion'],
  ]
  for (const [id, plan] of entries) {
    if (id && id === priceId) return plan
  }
  console.warn('[webhook/planFromPriceId] unrecognised priceId:', priceId)
  return 'starter'
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return new Response('No signature', { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  console.log('[webhook] incoming POST — secret_set:', !!webhookSecret, 'secret_prefix:', webhookSecret?.slice(0, 12), 'sig_present:', !!sig)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] constructEvent failed:', message)
    return new Response(`Webhook signature failed: ${message}`, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    // ── New subscription created (after checkout) ──────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.client_reference_id
      const customerId  = session.customer as string

      console.log('[webhook] checkout.session.completed', { clerkUserId, customerId, subscription: session.subscription })

      if (!clerkUserId) {
        console.warn('[webhook] checkout.session.completed missing client_reference_id')
        break
      }

      // Resolve plan from subscription's price
      let plan = 'core' // default to core (safest fallback)
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price?.id
        if (priceId) plan = planFromPriceId(priceId)
        console.log('[webhook] resolved plan', { priceId, plan })
      }

      const { error } = await supabase.from('profiles').upsert({
        clerk_user_id:      clerkUserId,
        plan,
        stripe_customer_id: customerId,
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' })

      if (error) console.error('[webhook] supabase upsert error', error)
      else console.log('[webhook] profile updated', { clerkUserId, plan })

      break
    }

    // ── Subscription created (trial start) ───────────────────
    case 'customer.subscription.created': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId    = sub.items.data[0]?.price?.id
      const plan       = priceId ? planFromPriceId(priceId) : 'core'
      const status     = sub.status
      const clerkUserId = sub.metadata?.clerk_user_id

      console.log('[webhook] customer.subscription.created', { customerId, clerkUserId, priceId, plan, status })

      // If we have clerk_user_id in metadata, use it directly
      if (clerkUserId) {
        const { error } = await supabase.from('profiles').upsert({
          clerk_user_id:      clerkUserId,
          plan,
          stripe_customer_id: customerId,
          updated_at:         new Date().toISOString(),
        }, { onConflict: 'clerk_user_id' })
        if (error) console.error('[webhook] supabase upsert error', error)
        else console.log('[webhook] profile updated via subscription.created', { clerkUserId, plan })
      } else {
        // Fall back to matching by stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('clerk_user_id')
          .eq('stripe_customer_id', customerId)
          .single()
        if (profile?.clerk_user_id) {
          await supabase.from('profiles')
            .update({ plan, updated_at: new Date().toISOString() })
            .eq('clerk_user_id', profile.clerk_user_id)
          console.log('[webhook] profile updated via customer lookup', { plan })
        } else {
          console.warn('[webhook] subscription.created: no profile found for customer', customerId)
        }
      }

      break
    }

    // ── Subscription updated (plan change, renewal) ────────────
    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId    = sub.items.data[0]?.price?.id
      const plan       = priceId ? planFromPriceId(priceId) : 'core'
      const status     = sub.status // active, trialing, past_due, canceled, etc.

      // If subscription is no longer active, downgrade to core (starter doesn't exist as a plan)
      const activePlan = ['active', 'trialing'].includes(status) ? plan : 'core'

      const { data: profile } = await supabase
        .from('profiles')
        .select('clerk_user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile?.clerk_user_id) {
        await supabase.from('profiles')
          .update({ plan: activePlan, updated_at: new Date().toISOString() })
          .eq('clerk_user_id', profile.clerk_user_id)
      }

      break
    }

    // ── Subscription canceled / deleted ───────────────────────
    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: profile } = await supabase
        .from('profiles')
        .select('clerk_user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile?.clerk_user_id) {
        await supabase.from('profiles')
          .update({ plan: 'starter', updated_at: new Date().toISOString() })
          .eq('clerk_user_id', profile.clerk_user_id)
      }

      break
    }

    default:
      // Ignore unhandled events
      break
  }

  return new Response('ok', { status: 200 })
}
