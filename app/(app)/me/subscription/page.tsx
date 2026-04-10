import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MeHeader from '../_components/MeHeader'
import SubscriptionClient from './SubscriptionClient'

type Plan = 'free' | 'starter' | 'core' | 'companion'

export default async function SubscriptionPage() {
  const { userId } = await auth()

  let currentPlan: Plan = 'free'

  if (userId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('clerk_user_id', userId)
      .single()

    if (['starter', 'core', 'companion'].includes(data?.plan)) {
      currentPlan = data.plan as Plan
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
