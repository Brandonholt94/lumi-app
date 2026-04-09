import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import WelcomeScreen from './_components/WelcomeScreen'

export default async function WelcomePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, biggest_struggle, tone_preference')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/onboarding')

  return <WelcomeScreen name={profile.display_name ?? 'there'} />
}
