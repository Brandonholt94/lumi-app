'use client'

import { useRef, useState } from 'react'
import { useMood, type Mood } from '../../_components/MoodContext'

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8)
}

const MOODS: {
  key: Mood
  label: string
  color: string
  bg: string
  icon: (size: number) => React.ReactNode
}[] = [
  {
    key: 'drained',
    label: 'Drained',
    color: '#8FAAE0',
    bg: 'rgba(143,170,224,0.15)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6.5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M19 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="3" y="8.5" width="4" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    key: 'low',
    label: 'Low',
    color: '#9895B0',
    bg: 'rgba(152,149,176,0.15)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M20 17H4a4 4 0 010-8h.5A6.5 6.5 0 0120 12.5V17z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'okay',
    label: 'Okay',
    color: '#C8A030',
    bg: 'rgba(245,201,138,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'bright',
    label: 'Bright',
    color: '#F4A582',
    bg: 'rgba(244,165,130,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.2H21l-5.6 4.1 2.1 6.4L12 16l-5.5 3.7 2.1-6.4L3 9.2h6.8z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'wired',
    label: 'Wired',
    color: '#B86090',
    bg: 'rgba(232,160,191,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13 3L5.5 13H11.5L10.5 21L18.5 11H12.5L13 3Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function MoodSelector() {
  const { mood, setMood } = useMood()
  const [selected, setSelected] = useState<Mood>(mood ?? null)
  const [expanded, setExpanded] = useState<boolean>(!mood)
  const [justTapped, setJustTapped] = useState<Mood>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTap(key: Mood) {
    haptic()
    setSelected(key)
    setMood(key)
    setJustTapped(key)

    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => setJustTapped(null), 320)

    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    collapseTimer.current = setTimeout(() => setExpanded(false), 700)
  }

  const activeMood = MOODS.find(m => m.key === selected) ?? null

  // ── Collapsed pill ──────────────────────────────────────────────
  if (!expanded && activeMood) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            borderRadius: 14,
            border: `1.5px solid ${activeMood.color}44`,
            background: activeMood.bg,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
          }}
        >
          <span style={{ color: activeMood.color, display: 'flex', flexShrink: 0 }}>
            {activeMood.icon(18)}
          </span>
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: activeMood.color,
            flex: 1,
            textAlign: 'left',
          }}>
            {activeMood.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px',
            fontWeight: 500,
            color: activeMood.color,
            opacity: 0.5,
          }}>
            Change
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: activeMood.color, opacity: 0.5 }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    )
  }

  // ── Expanded tappable chips ────────────────────────────────────
  return (
    <div style={{ marginBottom: 16 }}>
      <style>{`
        @keyframes moodPop {
          0%   { transform: scale(1); }
          35%  { transform: scale(0.86); }
          65%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        .mood-pop { animation: moodPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      <div style={{
        borderRadius: 18,
        border: `1.5px solid ${activeMood ? activeMood.color + '44' : 'rgba(45,42,62,0.08)'}`,
        background: activeMood ? activeMood.bg : 'white',
        boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
        padding: '16px 12px 14px',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>

        {/* Prompt */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 700,
          color: activeMood ? activeMood.color : '#9895B0',
          textAlign: 'center',
          marginBottom: 14,
          letterSpacing: '0.03em',
          transition: 'color 0.35s ease',
          opacity: activeMood ? 0.8 : 1,
        }}>
          {activeMood ? activeMood.label.toUpperCase() : 'TAP TO CHECK IN'}
        </p>

        {/* Mood chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {MOODS.map((m) => {
            const isSelected = selected === m.key
            const isPopped = justTapped === m.key
            return (
              <button
                key={m.key}
                onClick={() => handleTap(m.key)}
                className={isPopped ? 'mood-pop' : ''}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px 8px',
                  borderRadius: 14,
                  border: isSelected ? `1.5px solid ${m.color}55` : '1.5px solid transparent',
                  background: isSelected ? `${m.color}18` : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Icon */}
                <span style={{
                  color: isSelected ? m.color : 'rgba(45,42,62,0.22)',
                  display: 'flex',
                  transition: 'color 0.2s ease',
                }}>
                  {m.icon(26)}
                </span>

                {/* Label */}
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: isSelected ? m.color : 'rgba(45,42,62,0.28)',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap',
                }}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
