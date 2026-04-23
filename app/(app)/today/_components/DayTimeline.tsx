'use client'

import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface CalEvent {
  id: string
  title: string
  start: string
  end: string
  calendar?: string
  source?: string
}

interface PersonalTask {
  id: string
  text: string
  scheduled_at: string
  completed: boolean
}

interface Row {
  key:      string
  time?:    string
  label:    string
  sub?:     string
  type:     'calendar' | 'task' | 'past-cal' | 'past-task' | 'free' | 'wind-down'
  isNow?:   boolean
  duration?: string
  taskId?:  string
  done?:    boolean
}

function fmt12(date: Date) {
  const h    = date.getHours()
  const m    = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function minsUntil(date: Date, now: Date) {
  return Math.round((date.getTime() - now.getTime()) / 60000)
}

function sourceLabel(event: CalEvent, now: Date): string {
  const start    = new Date(event.start)
  const diff     = minsUntil(start, now)
  const calLabel = event.source === 'microsoft' ? 'Outlook' : 'Google Calendar'
  if (diff > 0 && diff <= 90) return `${calLabel} · in ${diff}m`
  return calLabel
}

// Build a local ISO string for a given HH:MM today
function todayAtTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':')
  const d = new Date()
  d.setHours(parseInt(hStr), parseInt(mStr), 0, 0)
  return d.toISOString()
}

export default function DayTimeline({ plan }: { plan: string }) {
  const [events,    setEvents]    = useState<CalEvent[]>([])
  const [tasks,     setTasks]     = useState<PersonalTask[]>([])
  const [loading,   setLoading]   = useState(true)
  const [adding,    setAdding]    = useState(false)
  const [taskName,  setTaskName]  = useState('')
  const [taskTime,  setTaskTime]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const nowRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const now   = new Date()
    const nextH = now.getHours() + 1
    setTaskTime(`${nextH.toString().padStart(2, '0')}:00`)

    if (plan.toLowerCase() === 'companion') {
      Promise.all([
        fetch('/api/calendar/events?hours=24').then(r => r.json()).catch(() => ({})),
        fetch('/api/timeline-tasks').then(r => r.json()).catch(() => []),
      ]).then(([calData, taskData]) => {
        const evts = Array.isArray(calData) ? calData : (calData?.events ?? [])
        setEvents(evts)
        setTasks(Array.isArray(taskData) ? taskData : [])
        setLoading(false)
      })
    } else {
      fetch('/api/timeline-tasks').then(r => r.json()).catch(() => []).then(taskData => {
        setEvents([])
        setTasks(Array.isArray(taskData) ? taskData : [])
        setLoading(false)
      })
    }
  }, [])

  // Scroll "Now" into view
  useEffect(() => {
    if (!loading) {
      setTimeout(() => nowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200)
    }
  }, [loading])

  // Focus input when add row opens
  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 80)
  }, [adding])

  const now     = new Date()
  const nowMins = minutesFromMidnight(now)

  async function saveTask() {
    if (!taskName.trim() || !taskTime) return
    setSaving(true)
    const res = await fetch('/api/timeline-tasks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: taskName.trim(), scheduled_at: todayAtTime(taskTime) }),
    })
    if (res.ok) {
      const newTask = await res.json()
      setTasks(prev => [...prev, newTask].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ))
    }
    setTaskName('')
    setAdding(false)
    setSaving(false)
  }

  async function toggleTask(id: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: done } : t))
    if (done) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#F4A582', '#F5C98A', '#E8A0BF', '#8FAAE0'],
        scalar: 0.85,
      })
    }
    await fetch('/api/timeline-tasks', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, completed: done }),
    })
  }

  // Filter calendar events to today 6am–9pm
  const todayStr       = now.toISOString().slice(0, 10)
  const upcomingEvents = events
    .filter(e => {
      const start = new Date(e.start)
      const end   = new Date(e.end)
      return e.start.slice(0, 10) === todayStr
        && start.getHours() >= 6
        && end.getHours()   <= 21
    })
    .slice(0, 6)

  // Build unified rows
  type RawRow = Row & { sortMins: number }
  const rawRows: RawRow[] = []

  for (const event of upcomingEvents) {
    const start       = new Date(event.start)
    const end         = new Date(event.end)
    const startMins   = minutesFromMidnight(start)
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)
    const durationStr = durationMin >= 60 ? `${durationMin / 60}h` : `${durationMin}m`
    rawRows.push({
      key:      event.id,
      time:     fmt12(start),
      label:    event.title,
      sub:      sourceLabel(event, now),
      type:     startMins < nowMins ? 'past-cal' : 'calendar',
      duration: durationStr,
      sortMins: startMins,
    })
  }

  for (const task of tasks) {
    const start     = new Date(task.scheduled_at)
    const startMins = minutesFromMidnight(start)
    rawRows.push({
      key:     task.id,
      time:    fmt12(start),
      label:   task.text,
      type:    startMins < nowMins ? 'past-task' : 'task',
      taskId:  task.id,
      done:    task.completed,
      sortMins: startMins,
    })
  }

  // Sort by time
  rawRows.sort((a, b) => a.sortMins - b.sortMins)

  // Interleave "Now" marker
  const rows: Array<RawRow | { key: string; isNow: true; sortMins: number }> = []
  let nowInserted = false
  for (const row of rawRows) {
    if (!nowInserted && row.sortMins > nowMins) {
      rows.push({ key: 'now', isNow: true, sortMins: nowMins })
      nowInserted = true
    }
    rows.push(row)
  }
  if (!nowInserted) rows.push({ key: 'now', isNow: true, sortMins: nowMins })

  // Free afternoon block
  const hasAfternoonFree =
    upcomingEvents.filter(e => {
      const h = new Date(e.start).getHours()
      return h >= 12 && h <= 17
    }).length === 0 &&
    tasks.filter(t => {
      const h = new Date(t.scheduled_at).getHours()
      return h >= 12 && h <= 17
    }).length === 0 &&
    now.getHours() < 17

  if (hasAfternoonFree) {
    rows.push({ key: 'free', sortMins: 780, isNow: false } as unknown as RawRow)
  }

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

  const hasContent = rawRows.length > 0

  return (
    <div
      style={{
        background:   'white',
        borderRadius: 18,
        border:       '1px solid rgba(45,42,62,0.07)',
        boxShadow:    '0 2px 8px rgba(45,42,62,0.05)',
        marginBottom: 20,
        overflow:     'hidden',
      }}
    >
      {!hasContent && !adding && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: '#9895B0' }}>
            No events today — your day is open. 🌿
          </p>
        </div>
      )}

      {/* Timeline rows */}
      {hasContent && (
        <div style={{ paddingTop: 10, paddingBottom: 2 }}>
          {rows.map((row, idx) => {
            // Now marker
            if ('isNow' in row && row.isNow) {
              return (
                <div
                  key="now"
                  ref={nowRef}
                  style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, margin: '4px 0' }}
                >
                  <span style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
                    letterSpacing: '0.07em', color: '#F4A582', width: 44, flexShrink: 0,
                  }}>
                    NOW
                  </span>
                  <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #F4A582, transparent)', borderRadius: 1 }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4A582', flexShrink: 0 }} />
                </div>
              )
            }

            const r        = row as RawRow
            const isPast   = r.type === 'past-cal' || r.type === 'past-task'
            const isTask   = r.type === 'task' || r.type === 'past-task'
            const isFree   = r.key  === 'free'

            if (isFree) {
              return (
                <div key="free" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12, opacity: 0.7 }}>
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0', width: 44, flexShrink: 0 }}>—</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(94,194,105,0.6)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#5EC269' }}>Free time</p>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0', marginTop: 1 }}>Good window for your focus task</p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={r.key}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  padding:      '8px 16px',
                  gap:          12,
                  opacity:      isPast ? 0.45 : 1,
                  borderBottom: idx < rows.length - 1 ? '1px solid rgba(45,42,62,0.04)' : 'none',
                }}
              >
                {/* Time */}
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700,
                  color: '#9895B0', width: 44, flexShrink: 0, lineHeight: 1.2,
                }}>
                  {r.time}
                </span>

                {/* Dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isPast
                    ? 'rgba(45,42,62,0.15)'
                    : isTask
                      ? '#F4A582'
                      : '#8FAAE0',
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily:    'var(--font-nunito-sans)',
                    fontSize:      '13px',
                    fontWeight:    700,
                    color:         r.done ? '#9895B0' : '#1E1C2E',
                    lineHeight:    1.3,
                    whiteSpace:    'nowrap',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    textDecoration: r.done ? 'line-through' : 'none',
                  }}>
                    {r.label}
                  </p>
                  {r.sub && (
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0', lineHeight: 1.3, marginTop: 1 }}>
                      {r.sub}
                    </p>
                  )}
                </div>

                {/* Duration (calendar) or check (task) */}
                {!isTask && r.duration && (
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0', flexShrink: 0 }}>
                    {r.duration}
                  </span>
                )}
                {isTask && r.taskId && (
                  <button
                    onClick={() => toggleTask(r.taskId!, !r.done)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${r.done ? '#F4A582' : 'rgba(45,42,62,0.18)'}`,
                      background: r.done ? '#F4A582' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {r.done && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add task inline form */}
      {adding ? (
        <div style={{ padding: '10px 14px 12px', borderTop: hasContent ? '1px solid rgba(45,42,62,0.06)' : 'none' }}>
          <input
            ref={inputRef}
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveTask(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="e.g. Get kids from school"
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              marginBottom: 8, padding: '9px 12px',
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#1E1C2E',
              background: 'rgba(45,42,62,0.04)', border: '1.5px solid rgba(45,42,62,0.10)',
              borderRadius: 10, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="time"
              value={taskTime}
              onChange={e => setTaskTime(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 10,
                border: '1.5px solid rgba(45,42,62,0.10)',
                background: 'rgba(45,42,62,0.04)',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#1E1C2E',
                outline: 'none', flex: 1,
              }}
            />
            <button
              onClick={saveTask}
              disabled={saving || !taskName.trim()}
              style={{
                padding: '7px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 800, color: '#1E1C2E',
                cursor: saving || !taskName.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !taskName.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {saving ? '…' : 'Add'}
            </button>
            <button
              onClick={() => setAdding(false)}
              style={{
                padding: '7px 10px', borderRadius: 10, border: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#9895B0',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '10px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            borderTop: hasContent ? '1px solid rgba(45,42,62,0.05)' : 'none',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'rgba(244,165,130,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#C4A882' }}>
            Add to your day
          </span>
        </button>
      )}
    </div>
  )
}
