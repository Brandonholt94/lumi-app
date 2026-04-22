import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import EveningBrainClear from './_components/EveningBrainClear'
import DaySceneHeader from './_components/DaySceneHeader'
import WelcomeBack from './_components/WelcomeBack'
import MedCheckIn from './_components/MedCheckIn'
import SleepCard from './_components/SleepCard'
import YourDay from './_components/YourDay'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function TodayPage() {
  const { userId } = await auth()

  // Read display_name from profiles (set during onboarding)
  let firstName = 'Friend'
  if (userId) {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (data?.display_name) firstName = data.display_name
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>

      {/* ── Day scene header ── */}
      <DaySceneHeader firstName={firstName} />

      {/* ── Beige body ── */}
      <div className="flex flex-col px-5 pb-8" style={{ background: '#FBF8F5', paddingTop: 28 }}>

      {/* Re-entry banner — shows after 24h away */}
      <WelcomeBack />

      {/* Medication check-in — time-aware, disappears when all taken */}
      <MedCheckIn />

      {/* Sleep card — shows last night's log or "How'd you sleep?" prompt */}
      <SleepCard />

      {/* Mood check-in */}
      <p
        className="mb-[9px]"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
        }}
      >
        HOW&apos;S YOUR BRAIN TODAY?
      </p>
      <MoodSelector />

      {/* Lumi Nudge */}
      <LumiNudge />

      {/* One Focus card — fetches real task from AI + Supabase */}
      <OneFocusCard />

      {/* Evening wind-down — shows after 8pm */}
      <EveningBrainClear />

      {/* ── Your Day ── */}
      <p
        className="mb-3"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
        }}
      >
        YOUR DAY
      </p>
      <YourDay />

      </div>{/* end beige body */}
    </div>
  )
}
