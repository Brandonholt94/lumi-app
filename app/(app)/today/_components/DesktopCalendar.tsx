'use client'

import { useEffect, useRef, useState } from 'react'

const QUICK_EMOJIS = [
  '🏠','🧹','🛒','💼','📝','📞','🍳','🏋️','🚗',
  '🎯','⭐','💊','📚','✈️','💪','🔧','💰','🎂',
  '🌱','🐕','🎮','🧘','🚿','🌿','🎵','🏃','🧺','🛁',
]

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
  minute: number
  text: string
}

// ── Collision-aware layout ─────────────────────────────────────────────────
interface LayoutItem {
  id: string
  startMins: number
  endMins: number
  col: number
  totalCols: number
  type: 'event' | 'task'
  eventData?: CalEvent
  taskData?: PersonalTask
}

function computeColumnLayout(events: CalEvent[], tasks: PersonalTask[]): LayoutItem[] {
  type RawItem = Omit<LayoutItem, 'col' | 'totalCols'>

  const items: RawItem[] = []

  for (const e of events) {
    const start = new Date(e.start)
    const end   = e.end ? new Date(e.end) : new Date(start.getTime() + 60 * 60 * 1000)
    const sMins = start.getHours() * 60 + start.getMinutes()
    const eMins = end.getHours()   * 60 + end.getMinutes()
    items.push({ id: e.id, startMins: sMins, endMins: Math.max(eMins, sMins + 30), type: 'event', eventData: e })
  }

  for (const t of tasks) {
    const start = new Date(t.scheduled_at)
    const sMins = start.getHours() * 60 + start.getMinutes()
    items.push({ id: t.id, startMins: sMins, endMins: sMins + 30, type: 'task', taskData: t })
  }

  // Sort by start; break ties by duration desc (longer items get earlier columns)
  items.sort((a, b) =>
    a.startMins - b.startMins || (b.endMins - b.startMins) - (a.endMins - a.startMins)
  )

  // Greedy column assignment
  const colEnds: number[] = []
  const withCols = items.map(item => {
    let col = -1
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= item.startMins) { col = c; colEnds[c] = item.endMins; break }
    }
    if (col === -1) { col = colEnds.length; colEnds.push(item.endMins) }
    return { ...item, col }
  })

  // totalCols per item = max col+1 among all items that overlap this one
  return withCols.map(item => {
    let maxCol = item.col
    for (const other of withCols) {
      if (other.startMins < item.endMins && other.endMins > item.startMins) {
        maxCol = Math.max(maxCol, other.col)
      }
    }
    return { ...item, totalCols: maxCol + 1 }
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

/** Convert a column fraction to a CSS calc() string for left/right positioning */
function colEdge(frac: number) {
  return `calc(${(frac * 100).toFixed(2)}% + 3px)`
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
  const [dropTarget,   setDropTarget]   = useState<{ dayIdx: number; hour: number } | null>(null)
  const [emojiOpen,    setEmojiOpen]    = useState(false)
  const [hoveredTask,  setHoveredTask]  = useState<string | null>(null)
  const dragTaskId = useRef<string | null>(null)
  const inlineRef  = useRef<HTMLInputElement>(null)
  const emojiRef   = useRef<HTMLDivElement>(null)

  // close emoji picker on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false)
    }
    if (emojiOpen) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [emojiOpen])

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
      target.setHours(inlineAdd.hour, inlineAdd.minute, 0, 0)
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
    setAllTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, scheduled_at: newDate.toISOString() } : t)
    )
    await fetch('/api/timeline-tasks', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: taskId, scheduled_at: newDate.toISOString() }),
    })
  }

  async function deleteTask(taskId: string) {
    setAllTasks(prev => prev.filter(t => t.id !== taskId))
    await fetch('/api/timeline-tasks', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: taskId }),
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

        {/* Time body */}
        <div style={{ flex: 1 }}>
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

              // Build collision-aware layout for this day
              const layout = computeColumnLayout(day.events, day.tasks)

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
                  {/* Hour grid lines / click-to-add zones */}
                  {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
                    const hour     = HOUR_START + i
                    const isActive = inlineAdd?.dayIdx === di && inlineAdd?.hour === hour
                    return (
                      <div
                        key={hour}
                        className="lumi-hour-slot"
                        onClick={() => { if (!isActive) setInlineAdd({ dayIdx: di, hour, minute: 0, text: '' }) }}
                        style={{
                          position: 'absolute', top: i * HOUR_PX,
                          left: 0, right: 0, height: HOUR_PX,
                          borderTop: '1px solid rgba(45,42,62,0.05)',
                          zIndex: 1,
                        }}
                      />
                    )
                  })}

                  {/* Drop indicator */}
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

                  {/* ── All items via collision-aware layout ── */}
                  {layout.map(item => {
                    const leftStyle  = colEdge(item.col / item.totalCols)
                    const rightStyle = colEdge((item.totalCols - item.col - 1) / item.totalCols)

                    if (item.type === 'event') {
                      const e      = item.eventData!
                      const height = Math.max(26, (item.endMins - item.startMins) / 60 * HOUR_PX - 4)
                      const isPast = isToday && item.startMins < nowMins
                      return (
                        <div key={e.id} style={{
                          position: 'absolute',
                          top: topPx(item.startMins) + 2,
                          left: leftStyle, right: rightStyle, height,
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
                            }}>{fmt12(new Date(e.start))}</p>
                          )}
                        </div>
                      )
                    }

                    // Personal task
                    const t      = item.taskData!
                    const isPast = isToday && item.startMins < nowMins
                    return (
                      <div
                        key={t.id}
                        draggable
                        onMouseEnter={() => setHoveredTask(t.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onDragStart={ev => {
                          dragTaskId.current = t.id
                          ev.dataTransfer.effectAllowed = 'move'
                          ev.dataTransfer.setData('text/plain', t.id)
                        }}
                        onDragEnd={() => { setDropTarget(null); dragTaskId.current = null }}
                        style={{
                          position: 'absolute',
                          top: topPx(item.startMins) + 2,
                          left: leftStyle, right: rightStyle, height: 28,
                          borderRadius: 7,
                          background: isPast ? 'rgba(45,42,62,0.04)' : 'rgba(244,165,130,0.11)',
                          borderLeft: `3px solid ${isPast ? 'rgba(45,42,62,0.15)' : 'rgba(244,165,130,0.60)'}`,
                          padding: '0 4px 0 9px',
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
                        {hoveredTask === t.id && (
                          <button
                            onClick={ev => { ev.stopPropagation(); deleteTask(t.id) }}
                            style={{
                              flexShrink: 0, width: 18, height: 18, borderRadius: 4,
                              border: 'none', background: 'rgba(45,42,62,0.10)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginRight: 2,
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="#7A7890" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Inline add input */}
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
                        padding: '4px 6px',
                        boxShadow: '0 2px 10px rgba(244,165,130,0.18)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {/* Time picker */}
                        <input
                          type="time"
                          value={`${String(inlineAdd.hour).padStart(2,'0')}:${String(inlineAdd.minute).padStart(2,'0')}`}
                          onChange={e => {
                            const [h, m] = e.target.value.split(':').map(Number)
                            if (!isNaN(h) && !isNaN(m)) setInlineAdd(prev => prev ? { ...prev, hour: h, minute: m } : null)
                          }}
                          style={{
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '11px', fontWeight: 700,
                            color: '#F4A582',
                            background: 'rgba(244,165,130,0.08)',
                            border: '1px solid rgba(244,165,130,0.25)',
                            borderRadius: 5, padding: '2px 5px',
                            outline: 'none', flexShrink: 0,
                            cursor: 'pointer', width: 72,
                          }}
                        />

                        {/* Emoji picker */}
                        <div ref={emojiRef} style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setEmojiOpen(o => !o)}
                            style={{
                              width: 22, height: 22, borderRadius: 5, border: 'none',
                              background: emojiOpen ? 'rgba(244,165,130,0.15)' : 'transparent',
                              cursor: 'pointer', fontSize: '13px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >😊</button>
                          {emojiOpen && (
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
                              background: 'white', borderRadius: 12,
                              border: '1px solid rgba(45,42,62,0.10)',
                              boxShadow: '0 8px 24px rgba(45,42,62,0.14)',
                              padding: 8, display: 'grid',
                              gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, width: 210,
                            }}>
                              {QUICK_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onMouseDown={e => {
                                    e.preventDefault()
                                    setInlineAdd(prev => prev ? { ...prev, text: prev.text ? `${emoji} ${prev.text}` : emoji + ' ' } : null)
                                    setEmojiOpen(false)
                                    inlineRef.current?.focus()
                                  }}
                                  style={{
                                    width: 26, height: 26, fontSize: '14px', borderRadius: 5,
                                    border: 'none', background: 'transparent', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >{emoji}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          ref={inlineRef}
                          value={inlineAdd.text}
                          onChange={e => setInlineAdd(prev => prev ? { ...prev, text: e.target.value } : null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  { setEmojiOpen(false); saveInlineTask() }
                            if (e.key === 'Escape') { setEmojiOpen(false); setInlineAdd(null) }
                          }}
                          onBlur={() => { if (!inlineAdd.text.trim() && !emojiOpen) setInlineAdd(null) }}
                          placeholder="add task…"
                          style={{
                            flex: 1,
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
