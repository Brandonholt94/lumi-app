'use client'

import { useMood } from '../../_components/MoodContext'

export default function LowBatteryBanner() {
  const { mood, dismissLowBattery, lowBatteryDismissed } = useMood()

  if (mood !== 'drained' || lowBatteryDismissed) return null

  return (
    <div
      className="flex items-center justify-between rounded-[14px] px-4 py-3 mb-4"
      style={{
        background: 'rgba(232,160,191,0.12)',
        border: '1.5px solid rgba(232,160,191,0.35)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[15px]">🔋</span>
        <p
          style={{
            fontFamily: 'var(--font-quicksand)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2D2A3E',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700, color: '#C4669A' }}>Low Battery Mode</span> is on.{' '}
          Let&apos;s keep today light.
        </p>
      </div>
      <button
        onClick={dismissLowBattery}
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          color: '#C4669A',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          marginLeft: '8px',
        }}
      >
        Turn off
      </button>
    </div>
  )
}
