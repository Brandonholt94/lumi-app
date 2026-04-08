'use client'

import { useState } from 'react'

const defaultItems = [
  { key: 'meds',     label: 'Took meds'     },
  { key: 'water',    label: 'Drank water'   },
  { key: 'movement', label: 'Moved my body' },
  { key: 'eat',      label: 'Ate something' },
]

export default function RoutineCheckin() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Only show in the morning (before noon)
  const hour = new Date().getHours()
  if (hour >= 12) return null

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="mb-4">
      <p
        className="mb-[9px]"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
        }}
      >
        MORNING CHECK-IN
      </p>
      <div className="flex flex-col gap-2">
        {defaultItems.map((item) => {
          const done = checked.has(item.key)
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className="flex items-center gap-3 rounded-[12px] px-3 py-[10px] transition-all duration-150 text-left"
              style={{
                background: done ? 'rgba(244,165,130,0.08)' : 'white',
                border: done ? '1.5px solid rgba(244,165,130,0.35)' : '1.5px solid rgba(45,42,62,0.08)',
                boxShadow: '0 1px 4px rgba(45,42,62,0.04)',
              }}
            >
              {/* Checkbox */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '18px', height: '18px',
                  borderRadius: '5px',
                  background: done ? '#F4A582' : 'transparent',
                  border: done ? '1.5px solid #F4A582' : '1.5px solid rgba(45,42,62,0.2)',
                  transition: 'all 0.15s',
                }}
              >
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#1E1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: done ? '#9895B0' : '#2D2A3E',
                  textDecoration: done ? 'line-through' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
