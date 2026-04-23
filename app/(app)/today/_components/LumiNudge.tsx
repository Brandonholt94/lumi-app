'use client'

import { useMemo } from 'react'
import Link from 'next/link'

const nudges = [
  "You don't have to do everything today. Just one thing.",
  "Starting is the hardest part. You've already done it by opening this.",
  "Your brain works differently — that's not a flaw, it's a feature.",
  "Progress isn't always visible. You're doing more than you think.",
  "No streaks. No pressure. Just today.",
  "It's okay to start small. Small is still moving.",
  "You've handled hard days before. This one's no different.",
]

function getDailyNudge() {
  const day = new Date().getDay()
  return nudges[day % nudges.length]
}

// Lumi starburst icon (matches app icon)
function LumiIcon() {
  return (
    <svg width="26" height="23" viewBox="0 0 166.9 151.3" fill="none">
      <circle cx="83.8" cy="91" r="37.5" fill="white" />
      <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white" />
      <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9" fill="white" />
      <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white" />
      <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white" />
      <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white" />
      <rect x="10" y="133.4" width="147.6" height="7.9" rx="3.1" ry="3.1" fill="white" opacity="0.75" />
    </svg>
  )
}

export default function LumiNudge() {
  const nudge = useMemo(() => getDailyNudge(), [])

  return (
    <div style={{
      background:   '#2D2A3E',
      borderRadius: 18,
      padding:      '16px',
      marginBottom: 16,
      display:      'flex',
      gap:          14,
      alignItems:   'flex-start',
    }}>
      {/* Lumi icon bubble */}
      <div style={{
        width:          44,
        height:         44,
        borderRadius:   12,
        flexShrink:     0,
        background:     'linear-gradient(135deg, #F4A582, #F5C98A)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <LumiIcon />
      </div>

      {/* Text + link */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize:   '13px',
          fontWeight: 500,
          color:      'rgba(245,243,240,0.88)',
          lineHeight: 1.55,
          marginBottom: 8,
        }}>
          {nudge}
        </p>
        <Link
          href="/chat"
          style={{
            fontFamily:     'var(--font-nunito-sans)',
            fontSize:       '13px',
            fontWeight:     800,
            color:          '#F4A582',
            textDecoration: 'none',
          }}
        >
          Open Lumi →
        </Link>
      </div>
    </div>
  )
}
