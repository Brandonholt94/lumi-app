import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import ResourcesSection from './_components/ResourcesSection'
import EveningBrainClear from './_components/EveningBrainClear'
import DaySceneHeader from './_components/DaySceneHeader'
import WelcomeBack from './_components/WelcomeBack'
import MedCheckIn from './_components/MedCheckIn'
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

      {/* Medication check-in — time-aware, disappears when all taken */}
      <MedCheckIn />

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

      {/* Top row — Focus + Brain Dump */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Focus Session */}
        <Link
          href="/focus"
          className="flex flex-col items-start active:scale-[0.97] transition-transform"
          style={{
            background: 'rgba(245,201,138,0.16)',
            border: '1.5px solid rgba(245,201,138,0.36)',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(245,201,138,0.12)',
            padding: '16px 14px 14px',
            gap: 0,
          }}
        >
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: 'rgba(245,201,138,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.8"/>
              <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 3H14.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 3V5.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>
            Focus
          </span>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>
            Start a session
          </span>
        </Link>

        {/* Brain Dump */}
        <Link
          href="/capture"
          className="flex flex-col items-start active:scale-[0.97] transition-transform"
          style={{
            background: 'rgba(232,160,191,0.14)',
            border: '1.5px solid rgba(232,160,191,0.34)',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(232,160,191,0.10)',
            padding: '16px 14px 14px',
            gap: 0,
          }}
        >
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: 'rgba(232,160,191,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="26" height="26" viewBox="0 0 50 50">
              <path fill="#B86090" d="M 21 0 C 14.988281 0 11.445313 3.277344 10.3125 6.15625 C 7.210938 6.734375 4.414063 8.8125 3 12.0625 C 1.546875 15.398438 1.609375 19.886719 3.90625 24.9375 C 2.605469 26.632813 1.851563 28.816406 2.21875 31.03125 C 2.578125 33.21875 4.09375 35.257813 6.71875 36.46875 C 5.65625 38.921875 6 41.316406 7.34375 43 C 8.738281 44.75 11.007813 45.710938 13.375 45.875 C 14.074219 47.707031 15.371094 48.921875 16.78125 49.4375 C 18.375 50.019531 19.996094 50 21 50 C 22.644531 50 24.089844 49.214844 25 48 C 25.910156 49.210938 27.359375 49.988281 29 50 C 30.117188 50.007813 31.738281 49.726563 33.3125 48.875 C 34.699219 48.125 35.933594 46.785156 36.625 44.9375 C 38.867188 44.859375 41.085938 44.390625 42.5625 42.96875 C 43.371094 42.1875 43.894531 41.109375 43.96875 39.84375 C 44.027344 38.84375 43.738281 37.710938 43.25 36.5 C 45.90625 35.296875 47.484375 33.265625 47.875 31.0625 C 48.269531 28.851563 47.472656 26.636719 46.09375 24.9375 C 48.390625 19.886719 48.453125 15.398438 47 12.0625 C 45.585938 8.8125 42.789063 6.734375 39.6875 6.15625 C 38.554688 3.277344 35.011719 0 29 0 C 27.515625 0 26.117188 0.382813 25.21875 1.53125 C 25.136719 1.636719 25.070313 1.761719 25 1.875 C 24.929688 1.761719 24.863281 1.636719 24.78125 1.53125 C 23.882813 0.382813 22.484375 0 21 0 Z M 21 2 C 22.203125 2 22.785156 2.199219 23.21875 2.75 C 23.652344 3.300781 24 4.496094 24 6.65625 L 24 45 C 24 46.824219 22.789063 48 21 48 C 20.003906 48 18.625 47.984375 17.46875 47.5625 C 16.3125 47.140625 15.386719 46.429688 14.96875 44.75 L 14.78125 44 L 14 44 C 11.972656 44 9.976563 43.089844 8.90625 41.75 C 7.835938 40.410156 7.515625 38.714844 8.84375 36.5 L 9.5 35.4375 L 8.3125 35.0625 C 5.601563 34.160156 4.484375 32.507813 4.1875 30.71875 C 3.898438 28.960938 4.523438 27.019531 5.65625 25.75 C 5.679688 25.730469 5.699219 25.710938 5.71875 25.6875 L 5.75 25.65625 C 5.75 25.65625 8.179688 23 11 23 C 14.5625 23 16.3125 24.71875 16.3125 24.71875 C 16.558594 25.011719 16.953125 25.136719 17.320313 25.042969 C 17.691406 24.949219 17.976563 24.648438 18.054688 24.277344 C 18.132813 23.902344 17.988281 23.515625 17.6875 23.28125 C 17.6875 23.28125 15.246094 21 11 21 C 8.503906 21 6.480469 22.300781 5.3125 23.28125 C 3.566406 19.003906 3.71875 15.457031 4.84375 12.875 C 6.078125 10.035156 8.480469 8.316406 11.09375 8 L 11.78125 7.90625 L 11.9375 7.28125 C 12.476563 5.398438 15.390625 2 21 2 Z M 29 2 C 34.609375 2 37.523438 5.398438 38.0625 7.28125 L 38.21875 7.90625 L 38.90625 8 C 41.519531 8.316406 43.921875 10.035156 45.15625 12.875 C 46.261719 15.414063 46.433594 18.878906 44.78125 23.0625 C 44.488281 23.199219 44.28125 23.464844 44.21875 23.78125 C 44.21875 23.78125 44.015625 24.710938 42.90625 25.78125 C 41.796875 26.851563 39.792969 28 36 28 C 35.640625 27.996094 35.304688 28.183594 35.121094 28.496094 C 34.941406 28.808594 34.941406 29.191406 35.121094 29.503906 C 35.304688 29.816406 35.640625 30.003906 36 30 C 40.207031 30 42.800781 28.648438 44.28125 27.21875 C 44.535156 26.976563 44.746094 26.742188 44.9375 26.5 C 45.765625 27.703125 46.164063 29.238281 45.90625 30.6875 C 45.589844 32.46875 44.402344 34.15625 41.6875 35.0625 L 40.59375 35.40625 L 41.09375 36.4375 C 41.789063 37.832031 42.015625 38.921875 41.96875 39.71875 C 41.921875 40.515625 41.644531 41.0625 41.15625 41.53125 C 40.199219 42.453125 38.246094 42.980469 36.125 43 C 34.84375 42.542969 33.847656 41.886719 33.15625 41 C 32.433594 40.070313 32 38.832031 32 37 C 32.007813 36.691406 31.871094 36.398438 31.632813 36.203125 C 31.398438 36.007813 31.082031 35.933594 30.78125 36 C 30.316406 36.105469 29.988281 36.523438 30 37 C 30 39.167969 30.566406 40.929688 31.59375 42.25 C 32.417969 43.308594 33.511719 44.03125 34.75 44.5625 C 34.234375 45.777344 33.347656 46.582031 32.34375 47.125 C 31.128906 47.78125 29.734375 48.003906 29 48 C 27.203125 47.988281 26 46.824219 26 45 L 26 6.65625 C 26 4.496094 26.347656 3.300781 26.78125 2.75 C 27.214844 2.199219 27.796875 2 29 2 Z M 18.90625 9.96875 C 18.863281 9.976563 18.820313 9.988281 18.78125 10 C 18.316406 10.105469 17.988281 10.523438 18 11 C 18 11.167969 17.828125 11.984375 17.15625 12.65625 C 16.484375 13.328125 15.300781 14 13 14 C 12.640625 13.996094 12.304688 14.183594 12.121094 14.496094 C 11.941406 14.808594 11.941406 15.191406 12.121094 15.503906 C 12.304688 15.816406 12.640625 16.003906 13 16 C 15.699219 16 17.519531 15.171875 18.59375 14.09375 C 19.667969 13.015625 20 11.832031 20 11 C 20.011719 10.710938 19.894531 10.433594 19.6875 10.238281 C 19.476563 10.039063 19.191406 9.941406 18.90625 9.96875 Z M 32.90625 11.96875 C 32.863281 11.976563 32.820313 11.988281 32.78125 12 C 32.316406 12.105469 31.988281 12.523438 32 13 C 32 14.332031 32.59375 16.03125 34.03125 17.46875 C 35.46875 18.90625 37.777344 20 41 20 C 41.359375 20.003906 41.695313 19.816406 41.878906 19.503906 C 42.058594 19.191406 42.058594 18.808594 41.878906 18.496094 C 41.695313 18.183594 41.359375 17.996094 41 18 C 38.222656 18 36.53125 17.09375 35.46875 16.03125 C 34.40625 14.96875 34 13.667969 34 13 C 34.011719 12.710938 33.894531 12.433594 33.6875 12.238281 C 33.476563 12.039063 33.191406 11.941406 32.90625 11.96875 Z M 10.75 30 C 10.199219 30.015625 9.765625 30.480469 9.78125 31.03125 C 9.796875 31.582031 10.261719 32.015625 10.8125 32 C 13.5 32.445313 14.65625 33.878906 15.3125 35.40625 C 15.96875 36.933594 16 38.5 16 39 C 15.996094 39.359375 16.183594 39.695313 16.496094 39.878906 C 16.808594 40.058594 17.191406 40.058594 17.503906 39.878906 C 17.816406 39.695313 18.003906 39.359375 18 39 C 18 38.503906 18 36.566406 17.15625 34.59375 C 16.3125 32.621094 14.480469 30.554688 11.15625 30 C 11.050781 29.984375 10.949219 29.984375 10.84375 30 C 10.8125 30 10.78125 30 10.75 30 Z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>
            Brain Dump
          </span>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>
            Clear your head
          </span>
        </Link>
      </div>

      {/* Talk to Lumi — full width, horizontal */}
      <Link
        href="/chat"
        className="flex items-center active:scale-[0.98] transition-transform"
        style={{
          background: 'linear-gradient(135deg, rgba(244,165,130,0.18) 0%, rgba(245,201,138,0.14) 100%)',
          border: '1.5px solid rgba(244,165,130,0.30)',
          borderRadius: 20,
          boxShadow: '0 2px 10px rgba(244,165,130,0.14)',
          padding: '16px 18px',
          gap: 16,
          textDecoration: 'none',
        }}
      >
        <div style={{
          width: 48, height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(244,165,130,0.28), rgba(245,201,138,0.22))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5C7.31 3.5 3.5 6.92 3.5 11.1 3.5 13.26 4.55 15.2 6.25 16.57L5.5 20.5 9.62 18.55C10.38 18.73 11.18 18.82 12 18.82c4.69 0 8.5-3.42 8.5-7.6C20.5 7.04 16.69 3.5 12 3.5Z" stroke="#C86040" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="9"  cy="11.1" r="1.1" fill="#C86040"/>
            <circle cx="12" cy="11.1" r="1.1" fill="#C86040"/>
            <circle cx="15" cy="11.1" r="1.1" fill="#C86040"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '17px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2, lineHeight: 1.2 }}>
            Talk to Lumi
          </p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: '#9895B0' }}>
            167 hours a week — whenever you need
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" stroke="rgba(244,165,130,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Resources */}
      <div style={{ marginTop: 44 }}>
        <ResourcesSection />
      </div>

      </div>{/* end beige body */}
    </div>
  )
}
