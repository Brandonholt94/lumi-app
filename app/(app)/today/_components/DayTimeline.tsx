'use client'

import { useState, useEffect, useRef } from 'react'

interface CalEvent {
  id: string
  title: string
  start: string
  end: string
  calendar?: string
  source?: string
}

interface TimelineEvent {
  time: string        // "10:00 AM"
  label: string
  sub?: string        // "Google Calendar" / "Outlook · in 15 min"
  type: 'event' | 'focus' | 'free' | 'anchor-done' | 'wind-down'
  done?: boolean
}

function fmt12(date: Date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function minsUntil(date: Date, now: Date) {
  return Math.round((date.getTime() - now.getTime()) / 60000)
}

function sourceLabel(event: CalEvent, now: Date): string {
  const start = new Date(event.start)
  const diff = minsUntil(start, now)
  const calLabel = event.source === 'microsoft' ? 'Outlook' : 'Google Calendar'
  if (diff > 0 && diff <= 90) return `${calLabel} · in ${diff}m`
  return calLabel
}

export default function DayTimeline() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const nowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/calendar/events?hours=12')
      .then(r => r.json())
      .then(d => {
        setEvents(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Scroll "Now" line into view on mount
  useEffect(() => {
    if (!loading) {
      setTimeout(() => nowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200)
    }
  }, [loading])

  const now = new Date()
  const nowMins = minutesFromMidnight(now)

  // Build timeline rows from 7am to 9pm
  // Each event becomes a row; we insert a "Now" marker at current time
  const upcomingEvents = events
    .filter(e => {
      const start = new Date(e.start)
      const end = new Date(e.end)
      const startH = start.getHours()
      const endH = end.getHours()
      // Show events from 6am to 9pm today
      const todayStr = now.toISOString().slice(0, 10)
      const eventDate = e.start.slice(0, 10)
      return eventDate === todayStr && startH >= 6 && endH <= 21
    })
    .slice(0, 5)

  if (loading) {
    return (
      <div style={{ marginBottom: 20 }}>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        {[48, 48, 40].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 12, marginBottom: 8,
            background: 'linear-gradient(90deg,rgba(45,42,62,0.05) 25%,rgba(45,42,62,0.09) 50%,rgba(45,42,62,0.05) 75%)',
            backgroundSize: '200% 100%', animation: `shimmer 1.4s ease-in-out infinite ${i * 0.12}s`,
          }} />
        ))}
      </div>
    )
  }

  // Build rows — interleave "Now" in the right position
  const rows: Array<{ key: string; time?: string; label: string; sub?: string; type: string; isNow?: boolean; duration?: string }> = []
  let nowInserted = false

  for (const event of upcomingEvents) {
    const start = new Date(event.start)
    const end   = new Date(event.end)
    const startMins = minutesFromMidnight(start)
    const durationMins = Math.round((end.getTime() - start.getTime()) / 60000)
    const durationStr  = durationMins >= 60 ? `${durationMins / 60}h` : `${durationMins}m`

    // Insert "Now" before first future event
    if (!nowInserted && startMins > nowMins) {
      rows.push({ key: 'now', isNow: true, label: 'Now', type: 'now' })
      nowInserted = true
    }

    rows.push({
      key: event.id,
      time: fmt12(start),
      label: event.title,
      sub: sourceLabel(event, now),
      type: startMins < nowMins ? 'past' : 'upcoming',
      duration: durationStr,
    })
  }

  // If no future events inserted "Now" yet
  if (!nowInserted) {
    rows.push({ key: 'now', isNow: true, label: 'Now', type: 'now' })
  }

  // Add free block suggestion if there's a gap of 2+ hours in the afternoon
  const hasAfternoonFree = upcomingEvents.filter(e => {
    const h = new Date(e.start).getHours()
    return h >= 12 && h <= 17
  }).length === 0 && now.getHours() < 17

  if (hasAfternoonFree) {
    rows.push({
      key: 'free',
      time: '—',
      label: 'Free time',
      sub: 'Good window for your focus task',
      type: 'free',
    })
  }

  // Evening wind-down at 7pm
  if (now.getHours() < 19) {
    rows.push({
      key: 'wind-down',
      time: '7 PM',
      label: 'Evening wind-down',
      sub: undefined,
      type: 'wind-down',
    })
  }

  if (rows.filter(r => !r.isNow).length === 0) {
    return (
      <div style={{
        marginBottom: 20,
        background: 'white',
        borderRadius: 18,
        border: '1px solid rgba(45,42,62,0.07)',
        padding: '16px 16px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px',
          fontWeight: 500,
          color: '#9895B0',
        }}>
          No events today — your day is open. 🌿
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 18,
        border: '1px solid rgba(45,42,62,0.07)',
        boxShadow: '0 2px 8px rgba(45,42,62,0.05)',
        padding: '10px 0 6px',
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      {rows.map((row, idx) => {
        if (row.isNow) {
          return (
            <div
              key="now"
              ref={nowRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 10,
                margin: '4px 0',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.07em',
                color: '#F4A582',
                width: 44,
                flexShrink: 0,
              }}>
                NOW
              </span>
              <div style={{
                flex: 1,
                height: 2,
                background: 'linear-gradient(90deg, #F4A582, transparent)',
                borderRadius: 1,
              }} />
              <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: '#F4A582',
                flexShrink: 0,
              }} />
            </div>
          )
        }

        const isPast     = row.type === 'past'
        const isUpcoming = row.type === 'upcoming'
        const isFree     = row.type === 'free'
        const isWindDown = row.type === 'wind-down'

        return (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              gap: 12,
              opacity: isPast ? 0.45 : 1,
              borderBottom: idx < rows.length - 1 ? '1px solid rgba(45,42,62,0.04)' : 'none',
            }}
          >
            {/* Time */}
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#9895B0',
              width: 44,
              flexShrink: 0,
              lineHeight: 1.2,
            }}>
              {row.time}
            </span>

            {/* Dot */}
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              background: isPast
                ? 'rgba(45,42,62,0.15)'
                : isUpcoming
                  ? '#8FAAE0'
                  : isFree
                    ? 'rgba(94,194,105,0.6)'
                    : 'rgba(45,42,62,0.12)',
            }} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 700,
                color: isWindDown
                  ? '#9895B0'
                  : isFree
                    ? '#5EC269'
                    : '#1E1C2E',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {row.label}
              </p>
              {row.sub && (
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#9895B0',
                  lineHeight: 1.3,
                  marginTop: 1,
                }}>
                  {row.sub}
                </p>
              )}
            </div>

            {/* Duration */}
            {row.duration && (
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#9895B0',
                flexShrink: 0,
              }}>
                {row.duration}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
