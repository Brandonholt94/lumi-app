'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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

function dateForOffset(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// Build an ISO string for HH:MM on a given day offset
function atTime(timeStr: string, offset: number): string {
  const [hStr, mStr] = timeStr.split(':')
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(parseInt(hStr), parseInt(mStr), 0, 0)
  return d.toISOString()
}

interface AnchorState {
  anchors: string[]
  checked: number[]
}

interface Habit {
  id:    string
  name:  string
  emoji: string
  done:  boolean
}

interface FocusTask {
  task:        string | null
  capture_id:  string | null
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = mins / 60
  return h === Math.floor(h) ? `${h}h` : `${Math.round(h * 2) / 2}h`
}

// ── Quick emoji set for tasks ─────────────────────────────────
const QUICK_EMOJIS = [
  '🏠','🧹','🛒','💼','📝','📞','🍳','🏋️','🚗',
  '🎯','⭐','💊','📚','✈️','💪','🔧','💰','🎂',
  '🌱','🐕','🎮','🧘','🚿','🌿','🎵','🏃','🧺','🛁',
]

// ── Display grouping — same-minute items stack together ───────
type RawRow = Row & { sortMins: number; endMins: number }
type NowMarker = { key: string; isNow: true; sortMins: number }

type DisplayGroup =
  | { kind: 'now';    marker: NowMarker }
  | { kind: 'single'; row: RawRow }
  | { kind: 'multi';  sortMins: number; time?: string; rows: RawRow[] }

function buildDisplayGroups(
  rows: Array<RawRow | NowMarker>
): DisplayGroup[] {
  const groups: DisplayGroup[] = []
  let pending: RawRow[] = []

  function flush() {
    if (pending.length === 0) return
    if (pending.length === 1) {
      groups.push({ kind: 'single', row: pending[0] })
    } else {
      groups.push({ kind: 'multi', sortMins: pending[0].sortMins, time: pending[0].time, rows: [...pending] })
    }
    pending = []
  }

  for (const row of rows) {
    if ('isNow' in row && row.isNow) {
      flush()
      groups.push({ kind: 'now', marker: row as NowMarker })
      continue
    }
    const r = row as RawRow
    // Free block is always standalone
    if (r.key === 'free') {
      flush()
      groups.push({ kind: 'single', row: r })
      continue
    }
    // Group consecutive rows at the exact same minute
    if (pending.length > 0 && pending[pending.length - 1].sortMins === r.sortMins) {
      pending.push(r)
    } else {
      flush()
      pending.push(r)
    }
  }
  flush()
  return groups
}

export default function DayTimeline({ plan }: { plan: string }) {
  const [dayOffset,  setDayOffset]  = useState(0)
  const [events,     setEvents]     = useState<CalEvent[]>([])
  const [tasks,      setTasks]      = useState<PersonalTask[]>([])
  const [anchors,    setAnchors]    = useState<AnchorState | null>(null)
  const [habits,     setHabits]     = useState<Habit[]>([])
  const [focusTask,     setFocusTask]     = useState<FocusTask | null>(null)
  const [focusRefreshing, setFocusRefreshing] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [adding,     setAdding]     = useState(false)
  const [taskName,   setTaskName]   = useState('')
  const [taskTime,   setTaskTime]   = useState('')
  const [saving,     setSaving]     = useState(false)
  const [emojiOpen,  setEmojiOpen]  = useState(false)
  const nowRef       = useRef<HTMLDivElement>(null)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const emojiRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const now   = new Date()
    const nextH = now.getHours() + 1
    setTaskTime(`${nextH.toString().padStart(2, '0')}:00`)
    setAdding(false)
    setLoading(true)
    setEvents([])
    setTasks([])

    const date = dateForOffset(dayOffset)
    const isToday = dayOffset === 0

    const baseFetches: Promise<unknown>[] = [
      fetch(`/api/timeline-tasks?date=${date}`).then(r => r.json()).catch(() => []),
      isToday ? fetch('/api/morning-anchors').then(r => r.json()).catch(() => null) : Promise.resolve(null),
      isToday ? fetch('/api/habits').then(r => r.json()).catch(() => ({ habits: [] })) : Promise.resolve({ habits: [] }),
      isToday ? fetch('/api/focus').then(r => r.json()).catch(() => null) : Promise.resolve(null),
    ]

    if (plan.toLowerCase() === 'companion') {
      const fetches = [
        fetch(`/api/calendar/events?date=${date}`).then(r => r.json()).catch(() => ({})),
        ...baseFetches,
      ]
      Promise.all(fetches).then(([calData, taskData, anchorData, habitData, focusData]) => {
        const evts = Array.isArray(calData) ? calData : ((calData as { events?: CalEvent[] })?.events ?? [])
        setEvents(evts)
        setTasks(Array.isArray(taskData) ? taskData as PersonalTask[] : [])
        if (anchorData) setAnchors(anchorData as AnchorState)
        setHabits((habitData as { habits?: Habit[] })?.habits ?? [])
        if (focusData && !(focusData as Record<string, unknown>).error) setFocusTask(focusData as FocusTask)
        setLoading(false)
      })
    } else {
      Promise.all(baseFetches).then(([taskData, anchorData, habitData, focusData]) => {
        setEvents([])
        setTasks(Array.isArray(taskData) ? taskData as PersonalTask[] : [])
        if (anchorData) setAnchors(anchorData as AnchorState)
        setHabits((habitData as { habits?: Habit[] })?.habits ?? [])
        if (focusData && !(focusData as Record<string, unknown>).error) setFocusTask(focusData as FocusTask)
        setLoading(false)
      })
    }
  }, [dayOffset, plan])

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    if (emojiOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [emojiOpen])

  async function toggleHabit(id: string) {
    const habit = habits.find(h => h.id === id)
    if (!habit) return
    const newDone = !habit.done
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: newDone } : h))
    await fetch('/api/habits/log', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ habitId: id, done: newDone }),
    })
  }

  async function toggleAnchor(index: number) {
    if (!anchors) return
    const isDone = anchors.checked.includes(index)
    const newChecked = isDone
      ? anchors.checked.filter(i => i !== index)
      : [...anchors.checked, index]
    setAnchors({ ...anchors, checked: newChecked })
    await fetch('/api/morning-anchors', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ anchorIndex: index, checked: !isDone }),
    })
  }

  // Scroll "Now" into view within the scrollable container
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const container = scrollRef.current
        const nowEl     = nowRef.current
        if (container && nowEl) {
          const offset = nowEl.offsetTop - container.offsetTop - container.clientHeight / 2 + nowEl.clientHeight / 2
          container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
        }
      }, 200)
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
      body:    JSON.stringify({ content: taskName.trim(), scheduled_at: atTime(taskTime, dayOffset) }),
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
    setEmojiOpen(false)
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

  async function refreshFocus() {
    if (focusRefreshing) return
    setFocusRefreshing(true)
    try {
      const data = await fetch('/api/focus?bypass_pin=1').then(r => r.json())
      if (data && !(data as Record<string, unknown>).error) {
        setFocusTask(data as FocusTask)
      }
    } catch {
      // best-effort
    } finally {
      setFocusRefreshing(false)
    }
  }

  const isToday = dayOffset === 0

  // Build unified rows
  const rawRows: RawRow[] = []

  for (const event of events) {
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
      type:     isToday && startMins < nowMins ? 'past-cal' : 'calendar',
      duration: durationStr,
      sortMins: startMins,
      endMins:  minutesFromMidnight(end),
    })
  }

  for (const task of tasks) {
    const start     = new Date(task.scheduled_at)
    const startMins = minutesFromMidnight(start)
    rawRows.push({
      key:     task.id,
      time:    fmt12(start),
      label:   task.text,
      type:    isToday && startMins < nowMins ? 'past-task' : 'task',
      taskId:  task.id,
      done:    task.completed,
      sortMins: startMins,
      endMins:  startMins + 30,
    })
  }

  // Sort by time
  rawRows.sort((a, b) => a.sortMins - b.sortMins)

  // Interleave "Now" marker (today only)
  const rows: Array<RawRow | NowMarker> = []
  if (isToday) {
    let nowInserted = false
    for (const row of rawRows) {
      if (!nowInserted && row.sortMins > nowMins) {
        rows.push({ key: 'now', isNow: true, sortMins: nowMins })
        nowInserted = true
      }
      rows.push(row)
    }
    if (!nowInserted) rows.push({ key: 'now', isNow: true, sortMins: nowMins })
  } else {
    rows.push(...rawRows)
  }

  // ── Smart free gap detection (today only) ─────────────────────────────────
  if (isToday) {
    const DAY_END = 21 * 60
    const MIN_GAP = 90
    let freeGapStart: number | null    = null
    let freeGapDuration: number | null = null

    if (nowMins < DAY_END - MIN_GAP) {
      const futureItems = rawRows
        .filter(r => r.endMins > nowMins)
        .sort((a, b) => a.sortMins - b.sortMins)

      if (futureItems.length === 0) {
        freeGapStart    = nowMins
        freeGapDuration = Math.min(DAY_END - nowMins, 8 * 60)
      } else {
        const gapToFirst = futureItems[0].sortMins - nowMins
        if (gapToFirst >= MIN_GAP) {
          freeGapStart    = nowMins
          freeGapDuration = gapToFirst
        } else {
          for (let i = 0; i < futureItems.length - 1; i++) {
            const gapStart    = futureItems[i].endMins
            const gapEnd      = futureItems[i + 1].sortMins
            const gapDuration = gapEnd - gapStart
            if (gapDuration >= MIN_GAP) {
              freeGapStart    = gapStart
              freeGapDuration = gapDuration
              break
            }
          }
          if (freeGapStart === null) {
            const lastEnd  = futureItems[futureItems.length - 1].endMins
            const trailing = DAY_END - lastEnd
            if (trailing >= MIN_GAP) {
              freeGapStart    = lastEnd
              freeGapDuration = trailing
            }
          }
        }
      }
    }

    if (freeGapStart !== null && freeGapDuration !== null) {
      const displayDuration = Math.min(freeGapDuration, 4 * 60)
      rows.push({
        key:      'free',
        type:     'free',
        label:    `Free · ${fmtDuration(displayDuration)}`,
        sortMins: freeGapStart,
        endMins:  freeGapStart + freeGapDuration,
      } as RawRow)
      rows.sort((a, b) => a.sortMins - b.sortMins)
    }
  }

  // Build display groups (merges same-time rows)
  const displayGroups = buildDisplayGroups(rows)

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

  // ── Row renderer — renders a full row (time label + card) as a plain block div ──
  function renderSubRow(r: RawRow, _showDivider = false, timeLabel?: string) {
    const isPast      = r.type === 'past-cal' || r.type === 'past-task'
    const isTask      = r.type === 'task'     || r.type === 'past-task'
    const accentColor = isPast ? 'rgba(45,42,62,0.15)' : isTask ? '#F4A582' : '#8FAAE0'
    const cardBg      = isPast ? 'rgba(45,42,62,0.03)' : isTask ? 'rgba(244,165,130,0.07)' : 'rgba(143,170,224,0.10)'

    return (
      <div key={r.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0', width: 40, flexShrink: 0, lineHeight: 1.2, textAlign: 'right', paddingTop: 11 }}>
          {timeLabel ?? r.time ?? ''}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: cardBg, borderRadius: 12, opacity: isPast ? 0.55 : 1 }}>
          <div style={{ width: 3.5, alignSelf: 'stretch', borderRadius: 2, background: accentColor, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: r.done ? '#9895B0' : '#1E1C2E', lineHeight: 1.35, wordBreak: 'break-word', textDecoration: r.done ? 'line-through' : 'none' }}>
              {r.label}
            </p>
            {r.sub && <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0', lineHeight: 1.3, marginTop: 2 }}>{r.sub}</p>}
          </div>
          {!isTask && r.duration && <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0', flexShrink: 0 }}>{r.duration}</span>}
          {isTask && r.taskId && (
            <button onClick={() => toggleTask(r.taskId!, !r.done)} style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, border: `2px solid ${r.done ? '#F4A582' : 'rgba(45,42,62,0.18)'}`, background: r.done ? '#F4A582' : 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {r.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background:   'white',
        borderRadius: 18,
        border:       '1px solid rgba(45,42,62,0.07)',
        boxShadow:    '0 2px 8px rgba(45,42,62,0.05)',
        marginBottom: 20,
        position:     'relative',
      }}
    >
      <style>{`
        .lumi-timeline-scroll::-webkit-scrollbar { display: none; }
        .lumi-date-pills::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Date pills ── */}
      <div
        className="lumi-date-pills"
        style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 14px 10px', borderBottom: '1px solid rgba(45,42,62,0.05)', scrollbarWidth: 'none' }}
      >
        {Array.from({ length: 10 }, (_, i) => i).map(i => {
          const d          = new Date()
          d.setDate(d.getDate() + i)
          const isSelected = dayOffset === i
          const dayLetter  = d.toLocaleDateString('en-US', { weekday: 'narrow' })
          const dateNum    = d.getDate()
          return (
            <button
              key={i}
              onClick={() => setDayOffset(i)}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2,
                width: 44,
                padding: '7px 0 6px',
                borderRadius: 14,
                border: 'none',
                background: isSelected ? '#F4A582' : 'transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: isSelected ? '#1E1C2E' : '#7A7890', letterSpacing: '0.02em' }}>
                {dayLetter}
              </span>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '18px', fontWeight: 800, color: isSelected ? '#1E1C2E' : '#2D2A3E', lineHeight: 1.2 }}>
                {dateNum}
              </span>
              {/* dot — tasks exist on that day (today = sample, future = unknown until loaded) */}
              <div style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 2, background: i === dayOffset && tasks.length > 0 ? '#1E1C2E' : i !== dayOffset && i === 0 ? '#F4A582' : 'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* Morning anchors (today only) */}
      {isToday && anchors && anchors.anchors.length > 0 && (() => {
        const hour    = new Date().getHours()
        const allDone = anchors.checked.length === anchors.anchors.length
        if (allDone && hour >= 12) return null
        return (
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(45,42,62,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#C4A882' }}>
                MORNING ANCHORS
              </p>
              <a href="/me/anchors" style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 700, color: '#C4A882', textDecoration: 'none', opacity: 0.7 }}>
                Edit
              </a>
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              {anchors.anchors.map((text, i) => {
                const done = anchors.checked.includes(i)
                return (
                  <button key={i} onClick={() => toggleAnchor(i)} style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px 5px 8px', borderRadius: 20,
                    border: done ? 'none' : '1.5px solid rgba(45,42,62,0.12)',
                    background: done ? 'rgba(244,165,130,0.15)' : 'rgba(45,42,62,0.04)',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}>
                    {done ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#F4A582" opacity="0.30"/>
                        <path d="M7 12.5l3.5 3.5L17 9" stroke="#C8784A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid rgba(45,42,62,0.20)' }} />
                    )}
                    <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: done ? 700 : 600, color: done ? '#C8784A' : '#2D2A3E', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap' }}>
                      {text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Habits (today only) */}
      {isToday && habits.length > 0 && (
        <div style={{ padding: '10px 14px 10px', borderBottom: '1px solid rgba(45,42,62,0.05)' }}>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#C4A882', marginBottom: 8 }}>
            TODAY&apos;S HABITS
          </p>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
            {habits.map(habit => (
              <button key={habit.id} onClick={() => toggleHabit(habit.id)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px 5px 8px', borderRadius: 20,
                border: habit.done ? 'none' : '1.5px solid rgba(45,42,62,0.12)',
                background: habit.done ? 'rgba(232,160,191,0.18)' : 'rgba(45,42,62,0.04)',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>
                {habit.done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#E8A0BF" opacity="0.30"/>
                    <path d="M7 12.5l3.5 3.5L17 9" stroke="#B86090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: '12px', lineHeight: 1 }}>{habit.emoji}</span>
                )}
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: habit.done ? 700 : 600, color: habit.done ? '#B86090' : '#2D2A3E', textDecoration: habit.done ? 'line-through' : 'none', whiteSpace: 'nowrap' }}>
                  {habit.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasContent && !adding && !loading && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#9895B0' }}>
            {isToday ? 'Your day is open. 🌿' : 'Nothing scheduled yet.'}
          </p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: 'rgba(122,120,144,0.60)', marginTop: 4 }}>
            Tap &ldquo;Add to your day&rdquo; to plan something.
          </p>
        </div>
      )}

      {/* Timeline rows */}
      {hasContent && (
        <div
          ref={scrollRef}
          className="lumi-timeline-scroll"
          style={{
            padding: '10px 12px 4px',
            maxHeight: 340,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {displayGroups.map((group, gi) => {
            // Now marker
            if (group.kind === 'now') {
              return (
                <div key="now" ref={nowRef} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 4px', flexShrink: 0, width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.07em', color: '#F4A582', width: 40, flexShrink: 0 }}>
                    NOW
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4A582', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #F4A582 0%, rgba(244,165,130,0.15) 100%)', borderRadius: 1 }} />
                </div>
              )
            }

            // Single row (includes free block)
            if (group.kind === 'single') {
              const r      = group.row
              const isFree = r.key === 'free'

              if (isFree) {
                const hasTask = !!(focusTask?.task)
                return (
                  <div key="free" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
                    <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0', width: 40, flexShrink: 0, lineHeight: 1.2, textAlign: 'right', paddingTop: 11 }}>—</span>
                    <div style={{ flex: 1, border: '1.5px dashed rgba(245,201,138,0.60)', borderRadius: 12, padding: '10px 12px 10px 14px', background: 'rgba(245,201,138,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasTask ? 6 : 2 }}>
                        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800, color: '#C4A030' }}>{r.label}</p>
                        <span style={{ color: 'rgba(196,160,48,0.45)', fontSize: 14, flexShrink: 0 }}>✦</span>
                      </div>
                      {hasTask ? (
                        <>
                          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: '#2D2A3E', marginBottom: 8, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {focusTask!.task}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Link href="/focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, textDecoration: 'none', background: 'linear-gradient(135deg, #F4A582, #F5C98A)', boxShadow: '0 1px 6px rgba(244,165,130,0.30)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="#1E1C2E" /></svg>
                              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 800, color: '#1E1C2E' }}>Start Focus</span>
                            </Link>
                            <button onClick={refreshFocus} disabled={focusRefreshing} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, border: '1.5px solid rgba(45,42,62,0.10)', background: 'transparent', cursor: focusRefreshing ? 'not-allowed' : 'pointer', opacity: focusRefreshing ? 0.5 : 1, WebkitTapHighlightColor: 'transparent' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transition: 'transform 0.4s', transform: focusRefreshing ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                <path d="M4 4v5h5M20 20v-5h-5" stroke="#9895B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4.06 14.99A9 9 0 1 0 6 6.34M19.94 9A9 9 0 0 0 18 17.66" stroke="#9895B0" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0' }}>{focusRefreshing ? 'Thinking…' : 'Different task'}</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <Link href="/capture" style={{ textDecoration: 'none', display: 'block' }}>
                          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: '#9895B0', lineHeight: 1.3 }}>Good window for a focus task</p>
                          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: 'rgba(196,160,48,0.80)', marginTop: 4 }}>Set your One Focus →</p>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              }

              // Regular single row
              return renderSubRow(r, false, r.time)
            }

            // Multi-row group — each row renders as its own flat block row
            if (group.kind === 'multi') {
              return (
                <div key={`group-${gi}`}>
                  {group.rows.map((r, i) => renderSubRow(r, false, i === 0 ? (r.time ?? '') : ''))}
                </div>
              )
            }

            return null
          })}
        </div>
      )}

      {/* Add task inline form */}
      {adding ? (
        <div style={{ padding: '10px 14px 12px', borderTop: hasContent ? '1px solid rgba(45,42,62,0.06)' : 'none' }}>
          {/* Task name + emoji button */}
          <div style={{ position: 'relative', display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
            {/* Emoji button */}
            <div ref={emojiRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setEmojiOpen(o => !o)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: emojiOpen ? '1.5px solid rgba(244,165,130,0.5)' : '1.5px solid rgba(45,42,62,0.10)',
                  background: emojiOpen ? 'rgba(244,165,130,0.10)' : 'rgba(45,42,62,0.04)',
                  cursor: 'pointer', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Add emoji"
              >
                😊
              </button>

              {/* Emoji picker panel */}
              {emojiOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 200,
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid rgba(45,42,62,0.10)',
                  boxShadow: '0 8px 28px rgba(45,42,62,0.16)',
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 2,
                  width: 224,
                }}>
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setTaskName(n => n ? `${emoji} ${n}` : emoji + ' ')
                        setEmojiOpen(false)
                        setTimeout(() => inputRef.current?.focus(), 50)
                      }}
                      style={{
                        width: 28, height: 28, fontSize: '16px',
                        borderRadius: 6, border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,165,130,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTask(); if (e.key === 'Escape') { setAdding(false); setEmojiOpen(false) } }}
              placeholder="e.g. Get kids from school"
              style={{
                flex: 1, boxSizing: 'border-box',
                padding: '9px 12px',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#1E1C2E',
                background: 'rgba(45,42,62,0.04)', border: '1.5px solid rgba(45,42,62,0.10)',
                borderRadius: 10, outline: 'none',
              }}
            />
          </div>

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
              onClick={() => { setAdding(false); setEmojiOpen(false) }}
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
