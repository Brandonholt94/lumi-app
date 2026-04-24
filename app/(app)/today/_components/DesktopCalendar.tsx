'use client'

import { useEffect, useRef, useState } from 'react'

const HOUR_START = 7
const HOUR_END   = 22
const HOUR_PX    = 56
const TOTAL_H    = (HOUR_END - HOUR_START) * HOUR_PX  // 840

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

interface DayData {
  date: Date
  events: CalEvent[]
  tasks: PersonalTask[]
}

interface InlineAdd {
  dayIdx: number
  hour: number
  text: string
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function fmt12(date: Date) {
  const h    = date.getHours()
  const m    = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return m === 0
    ? `${h12}${ampm}`
    : `${h12}:${m.toString().padStart(2, '0')}${ampm}`
}

function fmtHour(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12  = h % 12 || 12
  return `${h12}${ampm}`
}

function colLabel(absOffset: number, date: Date): string {
  if (absOffset === 0) return 'Today'
  if (absOffset === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function topPx(mins: number) {
  return Math.max(0, (mins - HOUR_START * 60) / 60 * HOUR_PX)
}

export default function DesktopCalendar({ plan }: { plan: string }) {
  const [allTasks,   setAllTasks]   = useState<PersonalTask[]>([])
  const [allEvents,  setAllEvents]  = useState<CalEvent[]>([])
  const [days,       setDays]       = useState<DayData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [now,        setNow]        = useState(new Date())
  const [dayOffset,  setDayOffset]  = useState(0)
  const [inlineAdd,  setInlineAdd]  = useState<InlineAdd | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number; hour: number } | null>(null)
  const dragTaskId = useRef<string | null>(null)
  const inlineRef  = useRef<HTMLInputElement>(null)

  // Tick every minute for the NOW line
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Focus inline input whenever a new slot opens
  useEffect(() => {
    if (inlineAdd) setTimeout(() => inlineRef.current?.focus(), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineAdd?.dayIdx, inlineAdd?.hour])

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
    const base = [fetch('/api/timeline-tasks').then(r => r.json()).catch(() => [])]
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

  async function saveInlineTask() {
    if (!inlineAdd?.text.trim() || saving) return
    setSaving(true)
    try {
      const target = new Date()
      target.setDate(target.getDate() + dayOffset + inlineAdd.dayIdx)
      target.setHours(inlineAdd.hour, 0, 0, 0)
      const res = await fetch('/api/timeline-tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: inlineAdd.text.trim(), scheduled_at: target.toISOString() }),
      })
      if (res.ok) {
        const saved = await res.json()
        setAllTasks(prev => [
          ...prev,
          { id: saved.id, text: saved.text, scheduled_at: saved.scheduled_at, completed: false },
        ])
        setInlineAdd(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function rescheduleTask(taskId: string, newDate: Date) {
    // Optimistic update
    setAllTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, scheduled_at: newDate.toISOString() } : t)
    )
    // Persist
    await fetch('/api/timeline-tasks', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: taskId, scheduled_at: newDate.toISOString() }),
    })
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1, minHeight: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              background: 'white', borderRadius: 16,
              border: '1px solid rgba(45,42,62,0.07)', padding: 16,
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

  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowTop  = topPx(nowMins)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Navigation arrows ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, flexShrink: 0,
      }}>
        <button
          onClick={() => setDayOffset(o => Math.max(0, o - 3))}
          disabled={dayOffset === 0}
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: '1.5px solid rgba(45,42,62,0.10)',
            background: dayOffset === 0 ? 'transparent' : 'white',
            cursor: dayOffset === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: dayOffset === 0 ? 0.25 : 1, transition: 'opacity 0.15s', flexShrink: 0,
          }}
          aria-label="Previous 3 days"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#2D2A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
          fontWeight: 700, color: 'rgba(45,42,62,0.40)', letterSpacing: '0.03em',
        }}>
          {days.length > 0 && (() => {
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return `${fmt(days[0].date)} – ${fmt(days[2].date)}`
          })()}
        </span>

        <button
          onClick={() => setDayOffset(o => o + 3)}
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: '1.5px solid rgba(45,42,62,0.10)',
            background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          aria-label="Next 3 days"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#2D2A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Calendar: day headers + scrollable time body ─────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Day header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr',
          gap: '0 8px', marginBottom: 6, flexShrink: 0,
        }}>
          <div /> {/* time gutter spacer */}
          {days.map((day, di) => {
            const absOffset = dayOffset + di
            const isToday   = absOffset === 0
            return (
              <div key={di} style={{
                padding: '7px 12px',
                borderRadius: 10,
                background: isToday ? 'rgba(244,165,130,0.07)' : 'rgba(255,255,255,0.85)',
                border: isToday
                  ? '1.5px solid rgba(244,165,130,0.22)'
                  : '1px solid rgba(45,42,62,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '9px',
                    fontWeight: 800, letterSpacing: '0.08em',
                    color: isToday ? '#F4A582' : 'rgba(45,42,62,0.35)', marginBottom: 1,
                  }}>
                    {colLabel(absOffset, day.date).toUpperCase()}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
                    fontWeight: 600, color: isToday ? '#1E1C2E' : 'rgba(45,42,62,0.50)',
                  }}>
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {isToday && (
                  <span style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '9px',
                    fontWeight: 800, color: '#F4A582',
                    background: 'rgba(244,165,130,0.12)',
                    padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em',
                  }}>LIVE</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Scrollable time body */}
        <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr',
            gap: '0 8px', height: TOTAL_H,
          }}>

            {/* ── Time gutter ── */}
            <div style={{ position: 'relative' }}>
              {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: i * HOUR_PX - 5,
                  right: 4,
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '9px', fontWeight: 700,
                  color: 'rgba(45,42,62,0.25)',
                  textAlign: 'right', lineHeight: 1, letterSpacing: '0.01em',
                  userSelect: 'none',
                }}>
                  {fmtHour(HOUR_START + i)}
                </div>
              ))}
            </div>

            {/* ── Day columns ── */}
            {days.map((day, di) => {
              const absOffset = dayOffset + di
              const isToday   = absOffset === 0

              return (
                <div
                  key={day.date.toISOString()}
                  style={{
                    position: 'relative',
                    height: TOTAL_H,
                    background: 'white',
                    borderRadius: 12,
                    border: isToday
                      ? '1.5px solid rgba(244,165,130,0.20)'
                      : '1px solid rgba(45,42,62,0.07)',
                    overflow: 'hidden',
                  }}
                  onDragOver={e => {
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const hour = Math.floor((e.clientY - rect.top) / HOUR_PX) + HOUR_START
                    setDropTarget({ dayIdx: di, hour: Math.max(HOUR_START, Math.min(HOUR_END - 1, hour)) })
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={e => {
                    e.preventDefault()
                    if (!dragTaskId.current) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const hour = Math.max(HOUR_START, Math.min(HOUR_END - 1,
                      Math.floor((e.clientY - rect.top) / HOUR_PX) + HOUR_START))
                    const newDate = new Date(days[di].date)
                    newDate.setHours(hour, 0, 0, 0)
                    rescheduleTask(dragTaskId.current, newDate)
                    dragTaskId.current = null
                    setDropTarget(null)
                  }}
                >
                  {/* Hour grid lines — also serve as click-to-add zones */}
                  {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
                    const hour     = HOUR_START + i
                    const isActive = inlineAdd?.dayIdx === di && inlineAdd?.hour === hour
                    return (
                      <div
                        key={hour}
                        className="lumi-hour-slot"
                        onClick={() => { if (!isActive) setInlineAdd({ dayIdx: di, hour, text: '' }) }}
                        style={{
                          position: 'absolute', top: i * HOUR_PX,
                          left: 0, right: 0, height: HOUR_PX,
                          borderTop: '1px solid rgba(45,42,62,0.05)',
                          zIndex: 1,
                        }}
                      />
                    )
                  })}

                  {/* Drop indicator — 2px peach line at target hour */}
                  {dropTarget?.dayIdx === di && (
                    <div style={{
                      position: 'absolute',
                      top: (dropTarget.hour - HOUR_START) * HOUR_PX,
                      left: 6, right: 6, height: 2,
                      background: '#F4A582', borderRadius: 1,
                      zIndex: 10, pointerEvents: 'none',
                    }} />
                  )}

                  {/* NOW line */}
                  {isToday && nowMins >= HOUR_START * 60 && nowMins < HOUR_END * 60 && (
                    <div style={{
                      position: 'absolute', top: nowTop,
                      left: 0, right: 0, zIndex: 5,
                      display: 'flex', alignItems: 'center', pointerEvents: 'none',
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#F4A582', flexShrink: 0,
                        marginLeft: 4, marginTop: -3,
                      }} />
                      <div style={{ flex: 1, height: 1.5, background: 'rgba(244,165,130,0.45)' }} />
                    </div>
                  )}

                  {/* Calendar events */}
                  {day.events.map(e => {
                    const start  = new Date(e.start)
                    const sMins  = start.getHours() * 60 + start.getMinutes()
                    const endDt  = e.end ? new Date(e.end) : new Date(start.getTime() + 60 * 60 * 1000)
                    const eMins  = endDt.getHours() * 60 + endDt.getMinutes()
                    const height = Math.max(26, (eMins - sMins) / 60 * HOUR_PX - 4)
                    const isPast = isToday && sMins < nowMins
                    return (
                      <div key={e.id} style={{
                        position: 'absolute',
                        top: topPx(sMins) + 2, left: 5, right: 5, height,
                        borderRadius: 8,
                        background: 'rgba(143,170,224,0.13)',
                        borderLeft: '3px solid rgba(143,170,224,0.65)',
                        padding: '3px 7px',
                        zIndex: 3, overflow: 'hidden',
                        opacity: isPast ? 0.45 : 1,
                      }}>
                        <p style={{
                          fontFamily: 'var(--font-nunito-sans)',
                          fontSize: '11px', fontWeight: 700,
                          color: isPast ? '#9895B0' : '#1E1C2E',
                          lineHeight: 1.3,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>{e.title}</p>
                        {height > 34 && (
                          <p style={{
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '10px', fontWeight: 500, color: '#9895B0', marginTop: 1,
                          }}>{fmt12(start)}</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Personal tasks — draggable */}
                  {day.tasks.map(t => {
                    const start  = new Date(t.scheduled_at)
                    const sMins  = start.getHours() * 60 + start.getMinutes()
                    const isPast = isToday && sMins < nowMins
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={e => {
                          dragTaskId.current = t.id
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', t.id)
                        }}
                        onDragEnd={() => { setDropTarget(null); dragTaskId.current = null }}
                        style={{
                          position: 'absolute',
                          top: topPx(sMins) + 2, left: 5, right: 5, height: 28,
                          borderRadius: 7,
                          background: isPast ? 'rgba(45,42,62,0.04)' : 'rgba(244,165,130,0.11)',
                          borderLeft: `3px solid ${isPast ? 'rgba(45,42,62,0.15)' : 'rgba(244,165,130,0.60)'}`,
                          padding: '0 8px 0 9px',
                          zIndex: 4, overflow: 'hidden',
                          opacity: isPast ? 0.50 : 1,
                          cursor: 'grab',
                          display: 'flex', alignItems: 'center',
                          userSelect: 'none',
                        }}
                      >
                        <p style={{
                          fontFamily: 'var(--font-nunito-sans)',
                          fontSize: '11px', fontWeight: 700,
                          color: isPast ? '#9895B0' : '#1E1C2E',
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          flex: 1,
                        }}>{t.text}</p>
                      </div>
                    )
                  })}

                  {/* Inline add input — appears at the clicked hour */}
                  {inlineAdd?.dayIdx === di && (
                    <div style={{
                      position: 'absolute',
                      top: (inlineAdd.hour - HOUR_START) * HOUR_PX + 2,
                      left: 5, right: 5, zIndex: 20,
                    }}>
                      <div style={{
                        background: 'white',
                        border: '1.5px dashed rgba(244,165,130,0.55)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        boxShadow: '0 2px 10px rgba(244,165,130,0.18)',
                      }}>
                        <input
                          ref={inlineRef}
                          value={inlineAdd.text}
                          onChange={e => setInlineAdd(prev => prev ? { ...prev, text: e.target.value } : null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveInlineTask()
                            if (e.key === 'Escape') setInlineAdd(null)
                          }}
                          onBlur={() => { if (!inlineAdd.text.trim()) setInlineAdd(null) }}
                          placeholder={`${fmtHour(inlineAdd.hour)} — add task…`}
                          style={{
                            display: 'block', width: '100%',
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '11px', fontWeight: 600, color: '#1E1C2E',
                            background: 'transparent', border: 'none', outline: 'none',
                            caretColor: '#F4A582',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
