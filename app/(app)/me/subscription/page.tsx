import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import MeHeader from '../_components/MeHeader'
import SubscriptionClient from './SubscriptionClient'

type Plan = 'free' | 'core' | 'companion'

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_CORE_MONTHLY_PRICE_ID     ?? '']: 'core',
  [process.env.STRIPE_CORE_ANNUAL_PRICE_ID      ?? '']: 'core',
  [process.env.STRIPE_COMPANION_MONTHLY_PRICE_ID ?? '']: 'companion',
  [process.env.STRIPE_COMPANION_ANNUAL_PRICE_ID  ?? '']: 'companion',
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string }>
}) {
  const { userId } = await auth()
  const params = await searchParams

  let currentPlan: Plan = 'free'

  if (userId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Returning from Stripe portal — sync plan directly from Stripe ──
    if (params.sync === 'true') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('clerk_user_id', userId)
        .single()

      if (profile?.stripe_customer_id) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
          const subscriptions = await stripe.subscriptions.list({
            customer: profile.stripe_customer_id,
            status: 'all',
            limit: 1,
          })

          const sub = subscriptions.data[0]
          if (sub) {
            const priceId = sub.items.data[0]?.price?.id
            const activePlan = ['active', 'trialing'].includes(sub.status)
              ? (PRICE_TO_PLAN[priceId ?? ''] ?? 'free')
              : 'free'

            await supabase
              .from('profiles')
              .update({ plan: activePlan, updated_at: new Date().toISOString() })
              .eq('clerk_user_id', userId)

            currentPlan = activePlan
            console.log('[subscription] synced plan from portal', { activePlan, status: sub.status })
          }
        } catch (err) {
          console.error('[subscription] portal sync failed', err)
        }
      }
    }

    // ── Always read fresh plan from Supabase ──
    if (currentPlan === 'free') {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('clerk_user_id', userId)
        .single()

      if (data && ['core', 'companion'].includes(data.plan)) {
        currentPlan = data.plan as Plan
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>
      <MeHeader title="Your plan" />
      <div className="px-5" style={{ flex: 1 }}>
        <SubscriptionClient currentPlan={currentPlan} />
      </div>
    </div>
  )
}
