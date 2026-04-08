'use client'

import { useMemo } from 'react'

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

export default function LumiNudge() {
  const nudge = useMemo(() => getDailyNudge(), [])

  return (
    <div
      className="rounded-[14px] px-4 py-3 mb-4 flex gap-3 items-start"
      style={{
        background: 'rgba(244,165,130,0.07)',
        border: '1.5px solid rgba(244,165,130,0.18)',
      }}
    >
      <span style={{ fontSize: '14px', marginTop: '1px' }}>✦</span>
      <p
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#2D2A3E',
          lineHeight: 1.55,
        }}
      >
        <span style={{ fontWeight: 700, color: '#F4A582' }}>Lumi: </span>
        {nudge}
      </p>
    </div>
  )
}
