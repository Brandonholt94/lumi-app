'use client'

/**
 * TodaySideCards — shared contextual card stack
 *
 * Rendered identically on mobile and in the desktop right rail.
 * Every component here manages its own visibility rules (time-of-day,
 * user state, etc.) — no duplication of those rules across breakpoints.
 *
 * `desktop` adjusts icon / card sizes to fit the narrower 30% column.
 */

import Link from 'next/link'
import WelcomeBack from './WelcomeBack'
import MedCheckIn from './MedCheckIn'
import SleepCard from './SleepCard'
import SleepInsightCard from './SleepInsightCard'
import MorningAnchors from './MorningAnchors'
import LumiNudge from './LumiNudge'
import MoodSelector from './MoodSelector'
import EveningBrainClear from './EveningBrainClear'
import OneFocusCard from './OneFocusCard'
import ActionCards from './ActionCards'

interface Props {
  firstName: string
  plan: string
  desktop?: boolean
}

export default function TodaySideCards({ firstName, plan, desktop = false }: Props) {
  const iconSize   = desktop ? 36 : 44
  const iconRadius = desktop ? 10 : 12
  const iconSvg    = desktop ? 18 : 26
  const cardRadius = desktop ? 16 : 20
  const cardPad    = desktop ? '14px 14px 12px' : '16px 14px 14px'
  const labelSize  = desktop ? '13px' : '16px'
  const subSize    = desktop ? '11px' : '11px'

  return (
    <>
      {/* ── Banners (own visibility logic) ── */}
      <WelcomeBack />
      <MedCheckIn />
      <SleepCard />
      <SleepInsightCard />

      {/* ── Morning anchors (own visibility logic) ── */}
      <MorningAnchors />

      {/* ── Brain check-in (desktop: moved here from calendar bottom) ── */}
      <p className="lumi-section-label" style={{ marginTop: desktop ? 4 : 4 }}>
        HOW&apos;S YOUR BRAIN TODAY?
      </p>
      <div style={{ marginBottom: desktop ? 10 : 12 }}>
        <MoodSelector />
      </div>

      {/* ── Lumi contextual nudge ── */}
      <LumiNudge firstName={firstName} plan={plan} />

      {/* ── Evening wind-down (8 PM – 3 AM, dismissible) ── */}
      <EveningBrainClear />

      {/* ── Today's focus (hides empty state in evening) ── */}
      <OneFocusCard />

      {/* ── Quick actions ── */}
      <p
        className="lumi-section-label"
        style={{ marginTop: desktop ? 12 : 8 }}
      >
        QUICK ACTIONS
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: desktop ? 10 : 12,
        marginBottom: desktop ? 10 : 12,
      }}>
        {/* Focus Timer */}
        <Link
          href="/focus"
          className="active:scale-[0.97] transition-transform"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: cardPad, borderRadius: cardRadius, textDecoration: 'none',
            background: 'rgba(245,201,138,0.16)', border: '1.5px solid rgba(245,201,138,0.36)',
          }}
        >
          <div style={{
            width: iconSize, height: iconSize, borderRadius: iconRadius,
            background: 'rgba(245,201,138,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: desktop ? 10 : 12,
          }}>
            <svg width={iconSvg} height={iconSvg} viewBox="0 0 256 256" fill="#C49820">
              <path d="M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: labelSize, fontWeight: 700, color: '#1E1C2E', marginBottom: 3 }}>
            Focus
          </span>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: subSize, fontWeight: 500, color: '#9895B0' }}>
            Start a session
          </span>
        </Link>

        {/* Brain Dump */}
        <Link
          href="/capture"
          className="active:scale-[0.97] transition-transform"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: cardPad, borderRadius: cardRadius, textDecoration: 'none',
            background: 'rgba(232,160,191,0.14)', border: '1.5px solid rgba(232,160,191,0.34)',
          }}
        >
          <div style={{
            width: iconSize, height: iconSize, borderRadius: iconRadius,
            background: 'rgba(232,160,191,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: desktop ? 10 : 12,
          }}>
            <svg width={iconSvg} height={iconSvg} viewBox="0 0 256 256" fill="#B86090">
              <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124Z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: labelSize, fontWeight: 700, color: '#1E1C2E', marginBottom: 3 }}>
            Brain Dump
          </span>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: subSize, fontWeight: 500, color: '#9895B0' }}>
            Clear your head
          </span>
        </Link>
      </div>

      {/* Talk to Lumi — full-width row */}
      <Link
        href="/chat"
        className="flex items-center active:scale-[0.98] transition-transform mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(244,165,130,0.18) 0%, rgba(245,201,138,0.14) 100%)',
          border: '1.5px solid rgba(244,165,130,0.30)',
          borderRadius: desktop ? 16 : 20,
          padding: desktop ? '13px 16px' : '16px 18px',
          gap: desktop ? 12 : 16,
          textDecoration: 'none',
        }}
      >
        <div style={{
          width: desktop ? 40 : 48, height: desktop ? 40 : 48,
          borderRadius: desktop ? 10 : 12,
          background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width={desktop ? 24 : 28} height={desktop ? 21 : 25} viewBox="0 0 166.9 151.3" fill="none">
            <circle cx="83.8" cy="91" r="37.5" fill="white"/>
            <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white"/>
            <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" fill="white"/>
            <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white"/>
            <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white"/>
            <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: desktop ? '14px' : '17px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2 }}>
            Talk to Lumi
          </p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: desktop ? '11px' : '12px', fontWeight: 500, color: '#9895B0' }}>
            167 hours a week — whenever you need
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="rgba(244,165,130,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      <ActionCards plan={plan} />
    </>
  )
}
