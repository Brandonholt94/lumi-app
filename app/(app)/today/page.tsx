import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import ResourcesSection from './_components/ResourcesSection'
import EveningBrainClear from './_components/EveningBrainClear'
import DaySceneHeader from './_components/DaySceneHeader'
import WelcomeBack from './_components/WelcomeBack'
import Link from 'next/link'

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

      {/* Quick Actions */}
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
        QUICK ACTIONS
      </p>

      <div className="grid grid-cols-3 gap-2">
        {/* Focus Session — Gold wash */}
        <Link
          href="/focus"
          className="flex flex-col items-start rounded-[18px] transition-all active:scale-95"
          style={{
            background: 'rgba(245,201,138,0.14)',
            border: '1px solid rgba(245,201,138,0.32)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
            padding: '13px 11px 12px',
            gap: 0,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.65"/>
              <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 3H14.5" stroke="#C49820" strokeWidth="1.65" strokeLinecap="round"/>
              <path d="M12 3V5.5" stroke="#C49820" strokeWidth="1.65" strokeLinecap="round"/>
            </svg>
          </div>
          <span
            className="text-[11px] font-extrabold leading-tight mb-[3px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#2D2A3E' }}
          >
            Focus
          </span>
          <span
            className="text-[9.5px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontWeight: 600, color: '#9895B0' }}
          >
            Start a timer
          </span>
        </Link>

        {/* Brain Dump — Dawn Rose wash */}
        <Link
          href="/capture"
          className="flex flex-col items-start rounded-[18px] transition-all active:scale-95"
          style={{
            background: 'rgba(232,160,191,0.14)',
            border: '1px solid rgba(232,160,191,0.32)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
            padding: '13px 11px 12px',
            gap: 0,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M13 3.5L5.5 13H11.5L10.5 20.5L18.5 11H12.5L13 3.5Z" stroke="#B86090" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span
            className="text-[11px] font-extrabold leading-tight mb-[3px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#2D2A3E' }}
          >
            Brain dump
          </span>
          <span
            className="text-[9.5px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontWeight: 600, color: '#9895B0' }}
          >
            Clear your head
          </span>
        </Link>

        {/* Talk to Lumi — Peach wash */}
        <Link
          href="/chat"
          className="flex flex-col items-start rounded-[18px] transition-all active:scale-95"
          style={{
            background: 'rgba(244,165,130,0.14)',
            border: '1px solid rgba(244,165,130,0.32)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
            padding: '13px 11px 12px',
            gap: 0,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5C7.31 3.5 3.5 6.92 3.5 11.1C3.5 13.26 4.55 15.2 6.25 16.57L5.5 20.5L9.62 18.55C10.38 18.73 11.18 18.82 12 18.82C16.69 18.82 20.5 15.4 20.5 11.22C20.5 7.04 16.69 3.5 12 3.5Z" stroke="#C86040" strokeWidth="1.65" strokeLinejoin="round"/>
              <circle cx="9" cy="11.1" r="1" fill="#C86040"/>
              <circle cx="12" cy="11.1" r="1" fill="#C86040"/>
              <circle cx="15" cy="11.1" r="1" fill="#C86040"/>
            </svg>
          </div>
          <span
            className="text-[11px] font-extrabold leading-tight mb-[3px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#2D2A3E' }}
          >
            Talk to Lumi
          </span>
          <span
            className="text-[9.5px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontWeight: 600, color: '#9895B0' }}
          >
            Whatever&apos;s up
          </span>
        </Link>
      </div>

      {/* Resources */}
      <div style={{ marginTop: 28 }}>
        <ResourcesSection />
      </div>

      </div>{/* end beige body */}
    </div>
  )
}
