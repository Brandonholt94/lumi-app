'use client'

import { useEffect, useState } from 'react'

interface CalendarEvent {
  id:     string
  title:  string
  start:  string
  allDay: boolean
}

function minutesUntil(isoString: string): number {
  return Math.round((new Date(isoString).getTime() - Date.now()) / 60000)
}

export default function TimeBlinessAlert() {
  const [event,     setEvent]     = useState<CalendarEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/calendar/events?hours=2')
      .then(r => r.json())
      .then(data => {
        const upcoming = (data.events ?? []).filter((e: CalendarEvent) => {
          if (e.allDay) return false
          const mins = minutesUntil(e.start)
          return mins >= 5 && mins <= 90
        })
        if (upcoming.length > 0) setEvent(upcoming[0])
      })
      .catch(() => {})
  }, [])

  if (!event || dismissed) return null

  const mins  = minutesUntil(event.start)
  const label = mins <= 1 ? 'starting now' : `in ${mins} min`

  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             12,
        background:      'rgba(143,170,224,0.13)',
        border:          '1.5px solid rgba(143,170,224,0.30)',
        borderRadius:    16,
        padding:         '13px 14px',
        marginBottom:    16,
        position:        'relative',
      }}
    >
      {/* Clock icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(143,170,224,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="96" stroke="#8FAAE0" strokeWidth="20"/>
          <path d="M128 72V132L168 152" stroke="#8FAAE0" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize:   '11px',
          fontWeight:  800,
          letterSpacing: '0.08em',
          color:      '#8FAAE0',
          marginBottom: 2,
        }}>
          HEADS UP
        </p>
        <p style={{
          fontFamily:  'var(--font-nunito-sans)',
          fontSize:    '13px',
          fontWeight:   700,
          color:       '#2D2A3E',
          whiteSpace:  'nowrap',
          overflow:    'hidden',
          textOverflow:'ellipsis',
        }}>
          {event.title} — {label}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: 'rgba(45,42,62,0.3)', flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
