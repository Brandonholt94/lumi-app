'use client'

import { useState } from 'react'
import MeHeader from '../_components/MeHeader'

const HOURS = ['5h', '6h', '7h', '8h', '9h', '10h+']
const QUALITY = [
  { value: 'great', label: '😌 Great', desc: 'Rested and ready' },
  { value: 'okay', label: '😐 Okay', desc: 'Got through it' },
  { value: 'rough', label: '😩 Rough', desc: 'Tired and groggy' },
  { value: 'none', label: '😵 Barely slept', desc: 'Running on fumes' },
]

export default function SleepPage() {
  const [hours, setHours] = useState('7h')
  const [quality, setQuality] = useState('okay')
  const [saved, setSaved] = useState(false)

  function handleLog() {
    // TODO: persist to sleep_logs table in Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Sleep log" subtitle="Last night" />

      <div className="px-5">

        {/* Hours */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 10,
          paddingLeft: 4,
        }}>
          HOW MANY HOURS?
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {HOURS.map(h => (
            <button
              key={h}
              onClick={() => setHours(h)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: `1.5px solid ${hours === h ? '#F4A582' : 'rgba(45,42,62,0.12)'}`,
                background: hours === h
                  ? 'linear-gradient(135deg, rgba(244,165,130,0.12), rgba(245,201,138,0.12))'
                  : 'white',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '14px',
                fontWeight: 800,
                color: hours === h ? '#2D2A3E' : '#9895B0',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Quality */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 10,
          paddingLeft: 4,
        }}>
          HOW WAS IT?
        </p>

        <div style={{ marginBottom: 28 }}>
          {QUALITY.map((q, i) => (
            <button
              key={q.value}
              onClick={() => setQuality(q.value)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                marginBottom: i < QUALITY.length - 1 ? 8 : 0,
                borderRadius: 12,
                border: `1.5px solid ${quality === q.value ? '#F4A582' : 'rgba(45,42,62,0.08)'}`,
                background: quality === q.value
                  ? 'linear-gradient(135deg, rgba(244,165,130,0.08), rgba(245,201,138,0.08))'
                  : 'white',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{q.label.split(' ')[0]}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#2D2A3E',
                }}>
                  {q.label.split(' ').slice(1).join(' ')}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#9895B0',
                }}>
                  {q.desc}
                </p>
              </div>
              {quality === q.value && (
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#1E1C2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleLog}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: saved ? '#5A9F7A' : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: saved ? 'white' : '#1E1C2E',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Logged!' : 'Log sleep'}
        </button>

        <p style={{
          marginTop: 14,
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Lumi uses sleep data to understand your energy levels.
        </p>

      </div>
    </div>
  )
}
