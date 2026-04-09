import { currentUser } from '@clerk/nextjs/server'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import LowBatteryBanner from './_components/LowBatteryBanner'
import Link from 'next/link'
import ProfileButton from '../_components/ProfileButton'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function TodayPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? 'Friend'
  const greeting = getGreeting()
  const date = getFormattedDate()

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── White header ── */}
      <div style={{ background: '#ffffff', padding: '32px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '38px',
                fontWeight: 900,
                color: '#1E1C2E',
                lineHeight: 1.0,
                marginBottom: 6,
              }}
            >
              {greeting},<br />
              <span style={{ background: 'linear-gradient(90deg, #F4A582, #F5C98A, #8FAAE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {firstName}.
              </span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#9895B0',
            }}>
              {date} · Let&apos;s find your one thing.
            </p>
          </div>
          <ProfileButton />
        </div>
      </div>

      {/* ── Beige body ── */}
      <div className="flex flex-col flex-1 px-5 pb-4" style={{ background: '#FBF8F5', paddingTop: 28 }}>

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

      {/* Low Battery Mode banner — shows when Drained is selected */}
      <LowBatteryBanner />

      {/* Lumi Nudge */}
      <LumiNudge />

      {/* One Focus card — fetches real task from AI + Supabase */}
      <OneFocusCard />

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
