'use client'

import { useMood } from '../../_components/MoodContext'

const moods = [
  { key: 'foggy',   emoji: '😶', label: 'Foggy'   },
  { key: 'okay',    emoji: '😐', label: 'Okay'    },
  { key: 'wired',   emoji: '⚡', label: 'Wired'   },
  { key: 'drained', emoji: '😩', label: 'Drained' },
]

export default function MoodSelector() {
  const { mood, setMood } = useMood()

  return (
    <div className="grid grid-cols-4 gap-[7px] mb-4">
      {moods.map((m) => {
        const active = mood === m.key
        return (
          <button
            key={m.key}
            onClick={() => setMood(m.key as 'foggy' | 'okay' | 'wired' | 'drained')}
            className="flex flex-col items-center gap-1 rounded-[14px] py-[9px] px-1 transition-all duration-150"
            style={{
              background: active ? 'rgba(244,165,130,0.08)' : 'white',
              border: active ? '1.5px solid #F4A582' : '1.5px solid rgba(45,42,62,0.08)',
              boxShadow: '0 1px 4px rgba(45,42,62,0.04)',
            }}
          >
            <span className="text-[19px] leading-none">{m.emoji}</span>
            <span
              className="text-[10px] font-bold"
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                color: active ? '#C4663A' : '#2D2A3E',
              }}
            >
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
