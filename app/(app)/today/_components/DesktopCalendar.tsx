'use client'

import { useEffect, useRef, useState } from 'react'
import MoodSelector from './MoodSelector'

interface CalEvent {
  id: string
  title: string
  start: string
  end?: string
  source?: string
  allDay?: boolean
}

interface PersonalTask {
  id: string
  text: string
  scheduled_at: string
  completed: boolean
}

interface TimeRow {
  key: string
  sortMins: number
  time: string
  label: string
  sub?: string
  past: boolean
  isNow?: boolean
  type: 'event' | 'task' | 'now'
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function fmt12(date: Date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, '0')}${ampm}`
}

function colLabel(absOffset: number, date: Date): string {
  if (absOffset === 0) return 'Today'
  if (absOffset === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

interface DayData {
  date: Date
  events: CalEvent[]
  tasks: PersonalTask[]
}

export default function DesktopCalendar({ plan }: { plan: string }) {
  const [allTasks,   setAllTasks]   = useState<PersonalTask[]>([])
  const [allEvents,  setAllEvents]  = useState<CalEvent[]>([])
  const [days,       setDays]       = useState<DayData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [now,        setNow]        = useState(new Date())
  const [dayOffset,  setDayOffset]  = useState(0)   // 0 = today/tomorrow/+2
  const [addOpen,    setAddOpen]    = useState(false)
  const [taskText,   setTaskText]   = useState('')
  const [taskDay,    setTaskDay]    = useState(0)    // 0/1/2 relative to current window
  const [taskTime,   setTaskTime]   = useState('')
  const [saving,     setSaving]     = useState(false)
  const taskInputRef = useRef<HTMLInputElement>(null)

  // Tick every minute to keep NOW line fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Default task time = next full hour
  useEffect(() => {
    const h = new Date().getHours() + 1
    setTaskTime(`${String(Math.min(h, 23)).padStart(2, '0')}:00`)
  }, [])

  function openAdd() {
    setAddOpen(true)
    setTimeout(() => taskInputRef.current?.focus(), 80)
  }

  // Rebuild displayed days whenever offset / data changes
  useEffect(() => {
    if (loading) return
    const scaffold: DayData[] = Array.from({ length: 3 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + dayOffset + i)
      d.setHours(0, 0, 0, 0)
      return { date: d, events: [], tasks: [] }
    })
    scaffold.forEach(day => {
      day.events = allEvents
        .filter(e => sameDay(new Date(e.start), day.date))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      day.tasks = allTasks
        .filter(t => t.scheduled_at && sameDay(new Date(t.scheduled_at), day.date) && !t.completed)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    })
    setDays(scaffold)
  }, [dayOffset, allTasks, allEvents, loading])

  // Initial data fetch — wide window so navigation works client-side
  useEffect(() => {
    const base = [
      fetch('/api/timeline-tasks').then(r => r.json()).catch(() => []),
    ]
    const allFetches =
      plan.toLowerCase() === 'companion'
        ? [fetch('/api/calendar/events?hours=336').then(r => r.json()).catch(() => ({})), ...base]
        : base

    Promise.all(allFetches).then(results => {
      if (plan.toLowerCase() === 'companion') {
        const [calData, taskData] = results
        const raw = Array.isArray(calData)
          ? calData
          : ((calData as { events?: CalEvent[] })?.events ?? [])
        setAllEvents(raw.filter((e: CalEvent) => !e.allDay))
        setAllTasks(Array.isArray(taskData) ? (taskData as PersonalTask[]) : [])
      } else {
        const [taskData] = results
        setAllTasks(Array.isArray(taskData) ? (taskData as PersonalTask[]) : [])
      }
      setLoading(false)
    })
  }, [plan])

  async function saveTask() {
    if (!taskText.trim() || saving) return
    setSaving(true)
    try {
      const target = new Date()
      target.setDate(target.getDate() + dayOffset + taskDay)
      const [hStr, mStr] = taskTime.split(':')
      target.setHours(parseInt(hStr), parseInt(mStr), 0, 0)

      const res = await fetch('/api/timeline-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: taskText.trim(), scheduled_at: target.toISOString() }),
      })
      if (res.ok) {
        const saved = await res.json()
        const newTask: PersonalTask = {
          id: saved.id, text: saved.text,
          scheduled_at: saved.scheduled_at, completed: false,
        }
        setAllTasks(prev => [...prev, newTask])
        setTaskText('')
        setAddOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1, minHeight: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            background: 'white', borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: 16,
          }}>
            <div style={{ height: 10, width: '45%', borderRadius: 6, background: 'rgba(45,42,62,0.07)', marginBottom: 18 }} />
            {[75, 60, 85, 50].map((w, j) => (
              <div key={j} style={{
                height: 32, width: `${w}%`, borderRadius: 8,
                background: 'rgba(45,42,62,0.04)', marginBottom: 8,
              }} />
            ))}
          </div>
        ))}
      </div>
      </div>
    )
  }

  const nowMins     = now.getHours() * 60 + now.getMinutes()
  const isCompanion = plan.toLowerCase() === 'companion'

  return (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    {/* ── Navigation arrows ─────────────────────────────────── */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <button
        onClick={() => setDayOffset(o => Math.max(0, o - 3))}
        disabled={dayOffset === 0}
        style={{
          width: 30, height: 30, borderRadius: 8,
          border: '1.5px solid rgba(45,42,62,0.10)',
          background: dayOffset === 0 ? 'transparent' : 'white',
          cursor: dayOffset === 0 ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: dayOffset === 0 ? 0.25 : 1,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
        aria-label="Previous 3 days"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="#2D2A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '11px', fontWeight: 700,
        color: 'rgba(45,42,62,0.40)',
        letterSpacing: '0.03em',
      }}>
        {days.length > 0 && (() => {
          const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return `${fmt(days[0].date)} – ${fmt(days[2].date)}`
        })()}
      </span>

      <button
        onClick={() => setDayOffset(o => o + 3)}
        style={{
          width: 30, height: 30, borderRadius: 8,
          border: '1.5px solid rgba(45,42,62,0.10)',
          background: 'white',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
          flexShrink: 0,
        }}
        aria-label="Next 3 days"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="#2D2A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>

    {/* ── 3-day grid ────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1, minHeight: 0 }}>
      {days.map((day, di) => {
        const absOffset = dayOffset + di
        const isToday   = absOffset === 0

        const rows: TimeRow[] = []

        day.events.forEach(e => {
          const start = new Date(e.start)
          const sMins = start.getHours() * 60 + start.getMinutes()
          rows.push({
            key: e.id, sortMins: sMins, time: fmt12(start),
            label: e.title,
            sub: e.source === 'microsoft' ? 'Outlook' : 'Google Calendar',
            past: isToday && sMins < nowMins,
            type: 'event',
          })
        })

        day.tasks.forEach(t => {
          const start = new Date(t.scheduled_at)
          const sMins = start.getHours() * 60 + start.getMinutes()
          rows.push({
            key: t.id, sortMins: sMins, time: fmt12(start),
            label: t.text, past: isToday && sMins < nowMins, type: 'task',
          })
        })

        rows.sort((a, b) => a.sortMins - b.sortMins)

        if (isToday && rows.length > 0) {
          const insertIdx = rows.findIndex(r => r.sortMins >= nowMins)
          rows.splice(insertIdx === -1 ? rows.length : insertIdx, 0, {
            key: '__now__', sortMins: nowMins, time: '', label: '',
            past: false, isNow: true, type: 'now',
          })
        }

        const isEmpty = day.events.length === 0 && day.tasks.length === 0

        return (
          <div
            key={day.date.toISOString()}
            style={{
              background:   'white',
              borderRadius: 16,
              border:       isToday
                ? '1.5px solid rgba(244,165,130,0.28)'
                : '1px solid rgba(45,42,62,0.09)',
              boxShadow:    isToday ? '0 2px 16px rgba(244,165,130,0.10)' : 'none',
              overflow:     'hidden',
              display:      'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Column header ── */}
            <div style={{
              padding: '12px 16px 10px',
              borderBottom: '1px solid rgba(45,42,62,0.05)',
              background: isToday ? 'rgba(244,165,130,0.05)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '10px', fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: isToday ? '#F4A582' : 'rgba(45,42,62,0.35)',
                  marginBottom: 1,
                }}>
                  {colLabel(absOffset, day.date).toUpperCase()}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px', fontWeight: 600,
                  color: isToday ? '#1E1C2E' : 'rgba(45,42,62,0.50)',
                }}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              {isToday && (
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '9px', fontWeight: 800,
                  color: '#F4A582',
                  background: 'rgba(244,165,130,0.12)',
                  padding: '3px 8px', borderRadius: 99,
                  letterSpacing: '0.06em',
                }}>
                  LIVE
                </span>
              )}
            </div>

            {/* ── Rows ── */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '10px 14px 14px',
              minHeight: 0, scrollbarWidth: 'none',
            }}>
              {isEmpty && !isCompanion && isToday ? (
                <div style={{ paddingTop: 8 }}>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '12px', fontWeight: 500,
                    color: 'rgba(45,42,62,0.30)', lineHeight: 1.5, marginBottom: 10,
                  }}>
                    No tasks scheduled for today
                  </p>
                </div>
              ) : isEmpty ? (
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px', fontWeight: 500,
                  color: 'rgba(45,42,62,0.25)', paddingTop: 8,
                }}>
                  {isToday ? 'Nothing scheduled' : 'Clear day ahead ✦'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {rows.map(row => {
                    if (row.isNow) {
                      return (
                        <div key="__now__" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '3px 0' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4A582', flexShrink: 0 }} />
                          <div style={{ flex: 1, height: 1, background: 'rgba(244,165,130,0.35)' }} />
                          <span style={{
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '9px', fontWeight: 800,
                            color: '#F4A582', letterSpacing: '0.06em',
                          }}>NOW</span>
                        </div>
                      )
                    }
                    return (
                      <div key={row.key} style={{
                        display: 'flex', gap: 9, alignItems: 'flex-start',
                        opacity: row.past ? 0.40 : 1, transition: 'opacity 0.2s',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-nunito-sans)',
                          fontSize: '10px', fontWeight: 600,
                          color: 'rgba(45,42,62,0.38)',
                          minWidth: 36, paddingTop: 4, whiteSpace: 'nowrap',
                        }}>
                          {row.time}
                        </span>
                        <div style={{
                          flex: 1, padding: '5px 10px 6px', borderRadius: 9,
                          background: row.type === 'event'
                            ? 'rgba(143,170,224,0.10)'
                            : 'rgba(244,165,130,0.08)',
                          borderLeft: `3px solid ${row.type === 'event' ? 'rgba(143,170,224,0.55)' : 'rgba(244,165,130,0.55)'}`,
                        }}>
                          <p style={{
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '12px', fontWeight: 600,
                            color: row.past ? '#9895B0' : '#1E1C2E',
                            lineHeight: 1.3,
                            textDecoration: row.past ? 'line-through' : 'none',
                          }}>
                            {row.label}
                          </p>
                          {row.sub && (
                            <p style={{
                              fontFamily: 'var(--font-nunito-sans)',
                              fontSize: '10px', fontWeight: 500,
                              color: '#9895B0', marginTop: 1,
                            }}>
                              {row.sub}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>

    {/* ── Mood + Add Task row ───────────────────────────────── */}
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 22, gap: 16,
    }}>
      {/* Mood selector — 40% width */}
      <div style={{ width: '40%', flexShrink: 0 }}>
        <p className="lumi-section-label" style={{ marginBottom: 8 }}>HOW&apos;S YOUR BRAIN TODAY?</p>
        <MoodSelector />
      </div>

      {/* Add Task pill — right-aligned */}
      {!addOpen && (
        <button
          onClick={openAdd}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         6,
            padding:     '9px 18px',
            borderRadius: 99,
            border:      'none',
            background:  'linear-gradient(135deg, #F4A582 0%, #F5C98A 100%)',
            boxShadow:   '0 2px 10px rgba(244,165,130,0.35)',
            cursor:      'pointer',
            fontFamily:  'var(--font-nunito-sans)',
            fontSize:    '13px',
            fontWeight:  800,
            color:       '#1E1C2E',
            transition:  'box-shadow 0.15s, transform 0.1s',
            flexShrink:  0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(244,165,130,0.55)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(244,165,130,0.35)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="#1E1C2E" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
      )}
    </div>

    {/* ── Add Task form ─────────────────────────────────────── */}
    {addOpen && (
      <div style={{
        marginTop:    12,
        background:   'white',
        border:       '1.5px solid rgba(244,165,130,0.40)',
        borderRadius: 14,
        padding:      '14px 14px 12px',
        boxShadow:    '0 2px 12px rgba(244,165,130,0.12)',
        animation:    'fadeIn 0.15s ease-out both',
      }}>
        <input
          ref={taskInputRef}
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter')  saveTask()
            if (e.key === 'Escape') setAddOpen(false)
          }}
          placeholder="What's the task?"
          style={{
            display: 'block', width: '100%',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px', fontWeight: 600, color: '#1E1C2E',
            background: 'transparent', border: 'none', outline: 'none',
            marginBottom: 10, caretColor: '#F4A582',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {days.map((d, di) => (
              <button
                key={di}
                onClick={() => setTaskDay(di)}
                style={{
                  padding: '5px 10px', borderRadius: 99,
                  border:      taskDay === di ? 'none' : '1.5px solid rgba(45,42,62,0.10)',
                  background:  taskDay === di ? 'rgba(244,165,130,0.15)' : 'transparent',
                  fontFamily:  'var(--font-nunito-sans)',
                  fontSize:    '11px',
                  fontWeight:  taskDay === di ? 800 : 600,
                  color:       taskDay === di ? '#C47850' : 'rgba(45,42,62,0.50)',
                  cursor:      'pointer', whiteSpace: 'nowrap',
                }}
              >
                {colLabel(dayOffset + di, d.date)}
              </button>
            ))}
          </div>
          <input
            type="time"
            value={taskTime}
            onChange={e => setTaskTime(e.target.value)}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '12px', fontWeight: 600,
              color: 'rgba(45,42,62,0.70)',
              border: '1.5px solid rgba(45,42,62,0.10)',
              borderRadius: 8, padding: '4px 8px',
              background: 'transparent', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={saveTask}
            disabled={!taskText.trim() || saving}
            style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
              background: taskText.trim() ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.06)',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px', fontWeight: 800,
              color:   taskText.trim() ? '#1E1C2E' : '#9895B0',
              cursor:  taskText.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Add Task'}
          </button>
          <button
            onClick={() => { setAddOpen(false); setTaskText('') }}
            style={{
              padding: '9px 14px', borderRadius: 10,
              border: '1.5px solid rgba(45,42,62,0.09)',
              background: 'transparent',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px', fontWeight: 700,
              color: '#9895B0', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
  )
}
