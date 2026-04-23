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
import DesktopCalendar from './_components/DesktopCalendar'

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
      <div className="lumi-today-root">

        {/* ════ SCENE HEADER — full width above both columns ════ */}
        <DaySceneHeader firstName={firstName} />

        {/* ════ TWO-COLUMN BODY ════ */}
        <div className="lumi-today-body">

        {/* ════ LEFT COLUMN — 70% on desktop, full width on mobile ════
            Desktop: 3-day calendar + mood
            Mobile:  full content flow                                   */}
        <div className="lumi-today-left">

          {/* ── DESKTOP: calendar + mood ── */}
          <div className="desktop-only" style={{ padding: '0 28px 32px', flex: 1 }}>
            <p className="lumi-section-label" style={{ marginBottom: 12 }}>YOUR WEEK</p>
            <DesktopCalendar plan={plan} />
          </div>

          {/* ── MOBILE: full content ── */}
          <div className="mobile-only" style={{ padding: '4px 20px 40px' }}>
            <WelcomeBack />
            <MedCheckIn />
            <SleepCard />

            <p className="lumi-section-label">HOW&apos;S YOUR BRAIN TODAY?</p>
            <MoodSelector />
            <MorningAnchors />

            <p className="lumi-section-label" style={{ marginTop: 4 }}>YOUR DAY</p>
            <DayTimeline plan={plan} />

            <LumiNudge firstName={firstName} plan={plan} />
            <EveningBrainClear />
            <OneFocusCard />

            <p className="lumi-section-label" style={{ marginTop: 8 }}>QUICK ACTIONS</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Link href="/focus" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
                background: 'rgba(245,201,138,0.16)', border: '1.5px solid rgba(245,201,138,0.36)',
                borderRadius: 20, padding: '16px 14px 14px',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,201,138,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.8"/>
                    <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 3H14.5M12 3V5.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3 }}>Focus</span>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>Start a session</span>
              </Link>

              <Link href="/capture" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
                background: 'rgba(232,160,191,0.14)', border: '1.5px solid rgba(232,160,191,0.34)',
                borderRadius: 20, padding: '16px 14px 14px',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,160,191,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="26" height="26" viewBox="0 0 256 256" fill="#B86090"><path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124Z"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3 }}>Brain Dump</span>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>Clear your head</span>
              </Link>
            </div>

            <Link href="/chat" className="flex items-center active:scale-[0.98] transition-transform mb-2" style={{
              background: 'linear-gradient(135deg, rgba(244,165,130,0.18) 0%, rgba(245,201,138,0.14) 100%)',
              border: '1.5px solid rgba(244,165,130,0.30)', borderRadius: 20, padding: '16px 18px', gap: 16, textDecoration: 'none',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #F4A582, #F5C98A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="28" height="25" viewBox="0 0 166.9 151.3" fill="none">
                  <circle cx="83.8" cy="91" r="37.5" fill="white"/>
                  <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white"/>
                  <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" fill="white"/>
                  <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white"/>
                  <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white"/>
                  <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '17px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2 }}>Talk to Lumi</p>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: '#9895B0' }}>167 hours a week — whenever you need</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="rgba(244,165,130,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <ActionCards plan={plan} />
          </div>
        </div>{/* end lumi-today-left */}

        {/* ════ RIGHT COLUMN — 30% on desktop only ════
            Focus card + Lumi nudge + quick action links  */}
        <div className="lumi-today-right">
          <div style={{ padding: '20px 22px 40px', display: 'flex', flexDirection: 'column' }}>

            {/* Banners (infrequent — show when triggered) */}
            <WelcomeBack />
            <MedCheckIn />
            <SleepCard />

            {/* Lumi nudge — top of right rail */}
            <LumiNudge firstName={firstName} plan={plan} />

            {/* Today's focus — below nudge */}
            <OneFocusCard />

            {/* Evening wind-down — shows after 8 PM */}
            <EveningBrainClear />

            {/* Quick actions — 2-col grid, taller cards */}
            <p className="lumi-section-label" style={{ marginTop: 12 }}>QUICK ACTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <Link href="/focus" className="active:scale-[0.97] transition-transform" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '16px 14px 14px', borderRadius: 16, textDecoration: 'none',
                background: 'rgba(245,201,138,0.14)', border: '1.5px solid rgba(245,201,138,0.35)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,201,138,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.8"/>
                    <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 3H14.5M12 3V5.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2 }}>Focus Timer</p>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', color: '#9895B0' }}>Start a session</p>
              </Link>

              <Link href="/capture" className="active:scale-[0.97] transition-transform" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '16px 14px 14px', borderRadius: 16, textDecoration: 'none',
                background: 'rgba(232,160,191,0.12)', border: '1.5px solid rgba(232,160,191,0.30)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,160,191,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 256 256" fill="#B86090"><path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124Z"/></svg>
                </div>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2 }}>Brain Dump</p>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', color: '#9895B0' }}>Clear your head</p>
              </Link>
            </div>

            <ActionCards plan={plan} />
          </div>
        </div>{/* end lumi-today-right */}

        </div>{/* end lumi-today-body */}

      </div>

      {/* Mobile-only floating FAB (desktop: Add Task is inline in calendar) */}
      <Link href="/capture" className="lumi-fab" aria-label="Brain Dump">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="#1E1C2E" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800, color: '#1E1C2E' }}>
          Brain Dump
        </span>
      </Link>
    </>
  )
}
