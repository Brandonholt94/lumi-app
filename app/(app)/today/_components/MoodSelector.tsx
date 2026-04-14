'use client'

import { useEffect, useRef, useState } from 'react'
import { useMood, type Mood } from '../../_components/MoodContext'

const MOODS: { key: Mood; label: string; color: string; bg: string; icon: React.ReactNode; iconSm: React.ReactNode }[] = [
  {
    key: 'drained',
    label: 'Drained',
    color: '#8FAAE0',
    bg: 'rgba(143,170,224,0.12)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6.5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M19 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="3" y="8.5" width="4" height="7" rx="1" fill="currentColor" opacity="0.45"/>
      </svg>
    ),
    iconSm: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6.5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M19 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="3" y="8.5" width="4" height="7" rx="1" fill="currentColor" opacity="0.45"/>
      </svg>
    ),
  },
  {
    key: 'low',
    label: 'Low',
    color: '#B8AECC',
    bg: 'rgba(184,174,204,0.12)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M20 17H4a4 4 0 010-8h.5A6.5 6.5 0 0120 12.5V17z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    iconSm: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 17H4a4 4 0 010-8h.5A6.5 6.5 0 0120 12.5V17z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'okay',
    label: 'Okay',
    color: '#C8A030',
    bg: 'rgba(245,201,138,0.14)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    iconSm: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'bright',
    label: 'Bright',
    color: '#C86040',
    bg: 'rgba(244,165,130,0.14)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.2H21l-5.6 4.1 2.1 6.4L12 16l-5.5 3.7 2.1-6.4L3 9.2h6.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
    iconSm: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.2H21l-5.6 4.1 2.1 6.4L12 16l-5.5 3.7 2.1-6.4L3 9.2h6.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'wired',
    label: 'Wired',
    color: '#B86090',
    bg: 'rgba(232,160,191,0.14)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L5.5 13H11.5L10.5 21L18.5 11H12.5L13 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconSm: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L5.5 13H11.5L10.5 21L18.5 11H12.5L13 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const MOOD_KEYS = MOODS.map(m => m.key) as NonNullable<Mood>[]

export default function MoodSelector() {
  const { mood, setMood } = useMood()

  const committedIdx = mood ? MOOD_KEYS.indexOf(mood) : -1
  const [previewIdx, setPreviewIdx] = useState<number>(committedIdx >= 0 ? committedIdx : 2)
  const commitTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start collapsed if mood already set, expanded if not
  const [expanded, setExpanded] = useState<boolean>(committedIdx < 0)

  // Keep preview in sync if mood changes externally (e.g. page load)
  useEffect(() => {
    if (committedIdx >= 0) setPreviewIdx(committedIdx)
  }, [committedIdx])

  const current = MOODS[previewIdx] ?? null

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = parseInt(e.target.value)
    setPreviewIdx(idx)

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8)
    }

    // Debounce commit — fires 650ms after user stops sliding
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      setMood(MOOD_KEYS[idx])
      // Collapse 300ms after commit lands, giving time for color to settle
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
      collapseTimer.current = setTimeout(() => setExpanded(false), 300)
    }, 650)
  }

  function handleCollapsedClick() {
    setExpanded(true)
  }

  // ── Collapsed pill ──────────────────────────────────────────────
  if (!expanded && mood) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleCollapsedClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            borderRadius: 14,
            border: `1.5px solid ${current.color}44`,
            background: current.bg,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
            transition: 'background 0.3s ease, border-color 0.3s ease',
          }}
        >
          {/* Small icon */}
          <span style={{ color: current.color, display: 'flex', flexShrink: 0 }}>
            {current.iconSm}
          </span>

          {/* Label */}
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: current.color,
            letterSpacing: '0.01em',
            flex: 1,
            textAlign: 'left',
          }}>
            {current.label}
          </span>

          {/* "Edit" hint */}
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px',
            fontWeight: 500,
            color: current.color,
            opacity: 0.5,
          }}>
            Change
          </span>

          {/* Chevron down */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: current.color, opacity: 0.5, flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    )
  }

  // ── Expanded slider ─────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 18,
        border: `1.5px solid ${current ? current.color + '55' : 'rgba(45,42,62,0.08)'}`,
        background: current ? current.bg : 'white',
        boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
        padding: '18px 16px 16px',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        {/* Icon + label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <div style={{ color: current?.color ?? '#C4C0D4', transition: 'color 0.3s ease' }}>
            {current?.icon ?? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3"/>
              </svg>
            )}
          </div>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 800,
            color: current?.color ?? '#C4C0D4',
            transition: 'color 0.3s ease',
            letterSpacing: '0.01em',
          }}>
            {current?.label ?? 'How\'s your brain?'}
          </p>
        </div>

        {/* Slider */}
        <div style={{ position: 'relative', padding: '0 4px' }}>
          {/* Dot markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            {MOODS.map((m, i) => (
              <div key={i} style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: previewIdx >= i ? (current?.color ?? '#C4C0D4') : 'rgba(45,42,62,0.12)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={previewIdx}
            onChange={handleSlider}
            style={{ width: '100%', cursor: 'pointer' }}
          />

          {/* Mood labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 700, color: '#9895B0' }}>
              Drained
            </span>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 700, color: '#9895B0' }}>
              Wired
            </span>
          </div>
        </div>
      </div>

      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 99px;
          background: rgba(45,42,62,0.10);
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid ${current?.color ?? '#C4C0D4'};
          box-shadow: 0 2px 8px rgba(45,42,62,0.15);
          cursor: pointer;
          transition: border-color 0.2s;
        }
        input[type=range]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid ${current?.color ?? '#C4C0D4'};
          box-shadow: 0 2px 8px rgba(45,42,62,0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
