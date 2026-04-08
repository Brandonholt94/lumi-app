import { currentUser } from '@clerk/nextjs/server'
import MoodSelector from './_components/MoodSelector'
import LumiNudge from './_components/LumiNudge'
import LowBatteryBanner from './_components/LowBatteryBanner'
import Link from 'next/link'

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
    <div className="flex flex-col h-full px-5 pt-3 pb-4 overflow-y-auto">

      {/* Greeting */}
      <h1
        className="leading-none mb-[5px]"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '38px',
          fontWeight: 900,
          color: '#1E1C2E',
          lineHeight: 1.0,
        }}
      >
        {greeting},<br />
        <span style={{ background: 'linear-gradient(90deg, #F4A582, #F5C98A, #8FAAE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {firstName}.
        </span>
      </h1>
      <p
        className="mb-5"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#9895B0',
        }}
      >
        {date} · Let&apos;s find your one thing.
      </p>

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

      {/* One Focus card */}
      <div
        className="rounded-[22px] p-4 mb-4 relative overflow-hidden"
        style={{ background: '#1E1C2E' }}
      >
        {/* Subtle glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40px', right: '-40px',
            width: '120px', height: '120px',
            background: 'radial-gradient(circle, rgba(244,165,130,0.14) 0%, transparent 70%)',
          }}
        />

        <p
          className="mb-2"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.13em',
            color: '#F4A582',
          }}
        >
          ✦ YOUR ONE FOCUS TODAY
        </p>

        <p
          className="mb-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '18px',
            fontWeight: 700,
            color: '#F5F3F0',
            lineHeight: 1.25,
          }}
        >
          Reply to Marcus about the project proposal
        </p>

        <div
          className="rounded-[11px] p-[10px_12px] mb-3"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'rgba(245,243,240,0.62)',
              lineHeight: 1.55,
            }}
          >
            <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi:</span>{' '}
            You&apos;ve been circling this one for a few days. Want to just open the email and read it? That&apos;s the whole first step.
          </p>
        </div>

        <Link
          href="/focus"
          className="block text-center rounded-full py-[13px] transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 800,
            color: '#1E1C2E',
          }}
        >
          Let&apos;s start →
        </Link>
      </div>

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

    </div>
  )
}
