'use client'

import { useMood, type Mood } from '../../_components/MoodContext'

const MOODS: { key: Mood; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
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
  },
]

const MOOD_KEYS = MOODS.map(m => m.key) as NonNullable<Mood>[]

export default function MoodSelector() {
  const { mood, setMood } = useMood()

  const currentIdx = mood ? MOOD_KEYS.indexOf(mood) : -1
  const current    = currentIdx >= 0 ? MOODS[currentIdx] : null

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = parseInt(e.target.value)
    setMood(MOOD_KEYS[idx])
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8)
    }
  }

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
                background: currentIdx >= i ? (current?.color ?? '#C4C0D4') : 'rgba(45,42,62,0.12)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={currentIdx >= 0 ? currentIdx : 2}
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
