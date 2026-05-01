'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  firstName: string
  plan: string
}

interface CalEvent {
  id:     string
  title:  string
  start:  string
  allDay: boolean
}

function minutesUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

function buildMessage(firstName: string, event: CalEvent | null): string {
  const hour = new Date().getHours()
  const name = firstName && firstName !== 'Friend' ? `, ${firstName}` : ''

  if (event) {
    const mins = minutesUntil(event.start)
    const timeStr = mins <= 1
      ? 'starting now'
      : mins < 60
        ? `in ${mins}m`
        : `in ${Math.round(mins / 60)}h`
    return `You've got ${event.title} ${timeStr}. Want to set a focus before it starts?`
  }

  if (hour >= 5 && hour < 10) {
    return `Morning${name}. Fresh start — what's the one thing that would make today feel good?`
  }
  if (hour >= 10 && hour < 13) {
    return `Morning's moving fast${name}. How's your focus holding up?`
  }
  if (hour >= 13 && hour < 17) {
    return `Afternoon check-in${name}. You've got the rest of the day — what matters most right now?`
  }
  if (hour >= 17 && hour < 21) {
    return `Evening${name}. You showed up today. That counts for more than you think.`
  }
  return `Still here${name}. No pressure — just checking in. What do you need right now?`
}


export default function LumiNudge({ firstName, plan }: Props) {
  const [event, setEvent] = useState<CalEvent | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Only fetch calendar events for companion plan
    if (plan.toLowerCase() === 'companion') {
      fetch('/api/calendar/events?hours=2')
        .then(r => r.json())
        .then(data => {
          const upcoming = (data.events ?? []).filter((e: CalEvent) => {
            if (e.allDay) return false
            const mins = minutesUntil(e.start)
            return mins >= 0 && mins <= 90
          })
          if (upcoming.length > 0) setEvent(upcoming[0])
          setReady(true)
        })
        .catch(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [plan])

  if (!ready) return null

  const message = buildMessage(firstName, event)

  return (
    <div style={{
      background:   '#2D2A3E',
      borderRadius: 18,
      padding:      '16px',
      marginBottom: 16,
      display:      'flex',
      gap:          14,
      alignItems:   'flex-start',
    }}>
      {/* Lumi icon */}
      <div style={{
        width:          44,
        height:         44,
        borderRadius:   12,
        flexShrink:     0,
        background:     '#FFFFFF',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      '0 2px 8px rgba(45,42,62,0.12)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumi-glow-icon.png" alt="Lumi" style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </div>

      {/* Text + link */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily:   'var(--font-nunito-sans)',
          fontSize:     '13px',
          fontWeight:   500,
          color:        'rgba(245,243,240,0.88)',
          lineHeight:   1.55,
          marginBottom: 8,
        }}>
          {message}
        </p>
        <Link
          href="/chat"
          style={{
            fontFamily:     'var(--font-nunito-sans)',
            fontSize:       '13px',
            fontWeight:     800,
            color:          '#F4A582',
            textDecoration: 'none',
          }}
        >
          Open Lumi →
        </Link>
      </div>
    </div>
  )
}
