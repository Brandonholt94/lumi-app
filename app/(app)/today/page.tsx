import { currentUser } from '@clerk/nextjs/server'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import ResourcesSection from './_components/ResourcesSection'
import EveningBrainClear from './_components/EveningBrainClear'
import GreetingHeader from './_components/GreetingHeader'
import Link from 'next/link'

export default async function TodayPage() {
  const user = await currentUser()
  // Prefer Clerk firstName → email prefix → 'Friend'
  const emailPrefix = user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? ''
  const firstName = user?.firstName
    ?? (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Friend')

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>

      {/* ── White header ── */}
      <GreetingHeader firstName={firstName} />

      {/* ── Beige body ── */}
      <div className="flex flex-col px-5 pb-8" style={{ background: '#FBF8F5', paddingTop: 28 }}>

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

      {/* Resources */}
      <ResourcesSection />

      {/* Quick Actions */}
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
        QUICK ACTIONS
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/focus"
          className="flex flex-col items-start gap-1 rounded-[16px] p-[11px_10px_10px] transition-all active:scale-95"
          style={{
            background: 'white',
            border: '1px solid rgba(45,42,62,0.07)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.04)',
          }}
        >
          <span className="text-[17px] leading-none mb-[2px]">⏱</span>
          <span
            className="text-[10.5px] font-extrabold leading-tight"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#2D2A3E' }}
          >
            Focus session
          </span>
          <span
            className="text-[9.5px]"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontWeight: 600, color: '#9895B0' }}
          >
            Start a timer
          </span>
        </Link>

        <Link
          href="/capture"
          className="flex flex-col items-start gap-1 rounded-[16px] p-[11px_10px_10px] transition-all active:scale-95"
          style={{
            background: 'white',
            border: '1px solid rgba(45,42,62,0.07)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.04)',
          }}
        >
          <span className="text-[17px] leading-none mb-[2px]">🧠</span>
          <span
            className="text-[10.5px] font-extrabold leading-tight"
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

        <Link
          href="/chat"
          className="flex flex-col items-start gap-1 rounded-[16px] p-[11px_10px_10px] transition-all active:scale-95"
          style={{
            background: 'white',
            border: '1px solid rgba(45,42,62,0.07)',
            boxShadow: '0 1px 4px rgba(45,42,62,0.04)',
          }}
        >
          <span className="text-[17px] leading-none mb-[2px]">💬</span>
          <span
            className="text-[10.5px] font-extrabold leading-tight"
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

      </div>{/* end beige body */}
    </div>
  )
}
