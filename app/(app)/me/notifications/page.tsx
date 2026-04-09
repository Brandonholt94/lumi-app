'use client'

import { useState } from 'react'
import MeHeader from '../_components/MeHeader'

type Toggle = {
  id: string
  label: string
  desc: string
  icon: string
}

const TOGGLES: Toggle[] = [
  { id: 'morning_checkin', label: 'Morning check-in', desc: 'Lumi says good morning around 8am', icon: '🌅' },
  { id: 'focus_reminder', label: 'Focus reminders', desc: 'Gentle nudge when you have tasks waiting', icon: '🎯' },
  { id: 'med_reminder', label: 'Medication reminders', desc: 'Based on your medication log schedule', icon: '💊' },
  { id: 'evening_checkin', label: 'Evening reflection', desc: 'Wind-down check-in around 8pm', icon: '🌙' },
  { id: 'weekly_report', label: 'Weekly Brain Report', desc: 'Your mood and activity summary every Sunday', icon: '📊' },
]

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    morning_checkin: true,
    focus_reminder: true,
    med_reminder: false,
    evening_checkin: false,
    weekly_report: true,
  })

  function toggle(id: string) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Notifications" />

      <div className="px-5">

        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          LUMI NUDGES
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {TOGGLES.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < TOGGLES.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
              gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#2D2A3E',
                  marginBottom: 1,
                }}>
                  {t.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#9895B0',
                }}>
                  {t.desc}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggle(t.id)}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 13,
                  background: enabled[t.id]
                    ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
                    : 'rgba(45,42,62,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: enabled[t.id] ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Lumi never spams. Every nudge is optional.{'\n'}You can change this anytime.
        </p>

      </div>
    </div>
  )
}
