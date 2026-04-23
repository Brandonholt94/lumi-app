import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import EveningBrainClear from './_components/EveningBrainClear'
import Link from 'next/link'
import DaySceneHeader from './_components/DaySceneHeader'
import WelcomeBack from './_components/WelcomeBack'
import MedCheckIn from './_components/MedCheckIn'
import SleepCard from './_components/SleepCard'
import ActionCards from './_components/ActionCards'
import MorningAnchors from './_components/MorningAnchors'
import DayTimeline from './_components/DayTimeline'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function TodayPage() {
  const { userId } = await auth()

  let firstName = 'Friend'
  let plan = 'core'
  if (userId) {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name, plan')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (data?.display_name) firstName = data.display_name
    plan = data?.plan ?? 'core'
  }

  return (
    <>
      {/* ── Two-column wrapper ── */}
      <div className="lumi-today-root">

        {/* ════ LEFT COLUMN — scene + contextual content ════ */}
        <div className="lumi-today-left">

          {/* Scene header */}
          <DaySceneHeader firstName={firstName} />

          {/* Content body */}
          <div className="flex flex-col px-5 pb-10" style={{ paddingTop: 28 }}>

            {/* Contextual banners */}
            <WelcomeBack />
            <MedCheckIn />
            <SleepCard />

            {/* Mood */}
            <p className="lumi-section-label">HOW&apos;S YOUR BRAIN TODAY?</p>
            <MoodSelector />

            {/* Morning routine */}
            <MorningAnchors />

            {/* ── YOUR DAY — in-flow on mobile, hidden on desktop (shown in right rail) ── */}
            <div className="lumi-cal-mobile">
              <p className="lumi-section-label" style={{ marginTop: 4 }}>YOUR DAY</p>
              <DayTimeline plan={plan} />
            </div>

            {/* ── ONE FOCUS + LUMI NUDGE — side-by-side on desktop ── */}
            <div className="lumi-focus-nudge-grid" style={{ marginBottom: 4 }}>
              <div><OneFocusCard /></div>
              <div><LumiNudge firstName={firstName} plan={plan} /></div>
            </div>

            {/* Evening wind-down — shows after 8 PM */}
            <EveningBrainClear />

            {/* ── QUICK ACTIONS ── */}
            <p className="lumi-section-label" style={{ marginTop: 8 }}>QUICK ACTIONS</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Link href="/focus" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
                background: 'rgba(245,201,138,0.16)', border: '1.5px solid rgba(245,201,138,0.36)',
                borderRadius: 20, boxShadow: '0 2px 8px rgba(245,201,138,0.12)', padding: '16px 14px 14px',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,201,138,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.8"/>
                    <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 3H14.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M12 3V5.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>Focus</span>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>Start a session</span>
              </Link>

              <Link href="/chat" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
                background: 'rgba(244,165,130,0.12)', border: '1.5px solid rgba(244,165,130,0.28)',
                borderRadius: 20, boxShadow: '0 2px 8px rgba(244,165,130,0.10)', padding: '16px 14px 14px',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(244,165,130,0.22), rgba(245,201,138,0.18))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="26" height="23" viewBox="0 0 166.9 151.3" fill="none">
                    <circle cx="83.8" cy="91" r="37.5" fill="#F4A582" />
                    <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="#F4A582" />
                    <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9" fill="#F4A582" />
                    <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="#F4A582" />
                    <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="#F4A582" />
                    <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="#F4A582" />
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>Talk to Lumi</span>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>167 hours a week</span>
              </Link>
            </div>

            {/* Setup nudge cards */}
            <ActionCards plan={plan} />

          </div>
        </div>

        {/* ════ RIGHT RAIL — calendar (desktop only) ════ */}
        <div className="lumi-today-right">
          {/* Sticky header */}
          <div style={{
            flexShrink: 0,
            padding: '24px 24px 12px',
            borderBottom: '1px solid rgba(45,42,62,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#9895B0',
              margin: 0,
            }}>
              YOUR DAY
            </p>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(45,42,62,0.35)',
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          {/* Calendar scroll area */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px 40px' }}>
            <DayTimeline plan={plan} />
          </div>
        </div>

      </div>

      {/* ── Floating Brain Dump FAB ── */}
      <Link href="/capture" className="lumi-fab" aria-label="Brain Dump">
        {/* Plus icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="#1E1C2E" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px',
          fontWeight: 800,
          color: '#1E1C2E',
          letterSpacing: '-0.01em',
        }}>
          Brain Dump
        </span>
      </Link>
    </>
  )
}
