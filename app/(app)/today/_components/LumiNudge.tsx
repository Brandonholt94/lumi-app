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

function LumiIcon() {
  return (
    <svg width="26" height="23" viewBox="0 0 166.9 151.3" fill="none">
      <circle cx="83.8" cy="91" r="37.5" fill="white" />
      <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white" />
      <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9" fill="white" />
      <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white" />
      <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white" />
      <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white" />
      <rect x="10" y="133.4" width="147.6" height="7.9" rx="3.1" ry="3.1" fill="white" opacity="0.75" />
    </svg>
  )
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
        background:     'linear-gradient(135deg, #F4A582, #F5C98A)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <LumiIcon />
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
