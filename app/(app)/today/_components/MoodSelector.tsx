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
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,56H32A24,24,0,0,0,8,80v96a24,24,0,0,0,24,24H200a24,24,0,0,0,24-24V80A24,24,0,0,0,200,56Zm8,120a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H200a8,8,0,0,1,8,8ZM64,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm192,0v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Z"/>
      </svg>
    ),
  },
  {
    key: 'low',
    label: 'Low',
    color: '#9895B0',
    bg: 'rgba(152,149,176,0.15)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,208H72a8,8,0,0,1,0-16h48a8,8,0,0,1,0,16Zm64-16H160a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Zm-24,32H104a8,8,0,0,0,0,16h56a8,8,0,0,0,0-16Zm72-124a76.08,76.08,0,0,1-76,76H76A52,52,0,0,1,76,72a53.26,53.26,0,0,1,8.92.76A76.08,76.08,0,0,1,232,100Zm-16,0A60.06,60.06,0,0,0,96,96.46a8,8,0,0,1-16-.92q.21-3.66.77-7.23A38.11,38.11,0,0,0,76,88a36,36,0,0,0,0,72h80A60.07,60.07,0,0,0,216,100Z"/>
      </svg>
    ),
  },
  {
    key: 'okay',
    label: 'Okay',
    color: '#C8A030',
    bg: 'rgba(245,201,138,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,40V32a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-8-8A8,8,0,0,0,50.34,61.66Zm0,116.68-8,8a8,8,0,0,0,11.32,11.32l8-8a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l8-8a8,8,0,0,0-11.32-11.32l-8,8A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l8,8a8,8,0,0,0,11.32-11.32ZM40,120H32a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16Zm88,88a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-8A8,8,0,0,0,128,208Zm96-88h-8a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16Z"/>
      </svg>
    ),
  },
  {
    key: 'bright',
    label: 'Bright',
    color: '#F4A582',
    bg: 'rgba(244,165,130,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"/>
      </svg>
    ),
  },
  {
    key: 'wired',
    label: 'Wired',
    color: '#B86090',
    bg: 'rgba(232,160,191,0.18)',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z"/>
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
