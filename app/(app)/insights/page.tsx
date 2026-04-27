'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfileButton from '../_components/ProfileButton'
import ResourcesSection from '../today/_components/ResourcesSection'
import type { SleepLog } from '@/app/api/sleep/route'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Mood = 'drained' | 'low' | 'okay' | 'bright' | 'wired'

interface DayDetail {
  date: string
  mood: { value: string; label: string; color: string } | null
  tasks: { completed: number; list: string[] }
  captures: { total: number }
  focus: { sessions: number; minutes: number; taskLabel: string | null }
  meds: { taken: boolean }
  oneFocus: { task: string; completed: boolean } | null
  reflection: string
}

interface InsightsData {
  plan: 'free' | 'core' | 'companion'
  week: { start: string; end: string }
  captures: {
    total: number
    byTag: { task: number; idea: number; worry: number; reminder: number; untagged: number }
    byDay: number[]
    busiestDay: string | null
    completedTasks: { text: string; created_at: string }[]
  }
  moods: { date: string; mood: Mood | null }[]
  focus: { sessions: number; minutes: number }
  activeDays: boolean[]
  highlight: string
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const MOOD_META: Record<Mood, { label: string; color: string; icon: React.ReactNode }> = {
  drained: {
    label: 'Drained', color: '#8FAAE0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6.5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.9"/>
        <path d="M19 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="3" y="8.5" width="4" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  low: {
    label: 'Low', color: '#B8AECC',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M20 17H4a4 4 0 010-8h.5A6.5 6.5 0 0120 12.5V17z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/>
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
      </svg>
    ),
  },
  okay: {
    label: 'Okay', color: '#C8A030',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
      </svg>
    ),
  },
  bright: {
    label: 'Bright', color: '#C86040',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.2H21l-5.6 4.1 2.1 6.4L12 16l-5.5 3.7 2.1-6.4L3 9.2h6.8z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
  },
  wired: {
    label: 'Wired', color: '#B86090',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L5.5 13H11.5L10.5 21L18.5 11H12.5L13 3Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
}

const TAG_META = {
  task:     { label: 'Tasks',     color: '#F4A582' },
  idea:     { label: 'Ideas',     color: '#F5C98A' },
  worry:    { label: 'Worries',   color: '#E8A0BF' },
  reminder: { label: 'Reminders', color: '#8FAAE0' },
}

const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

// Returns today's date in YYYY-MM-DD using LOCAL time, not UTC.
// new Date().toISOString() is UTC — at 9pm EST that's already "tomorrow".
function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatWeekRange(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end   + 'T12:00:00')
  const month = s.toLocaleDateString('en-US', { month: 'long' })
  return `${month} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
}

function dominantMood(moods: { mood: Mood | null }[]): Mood | null {
  const freq: Partial<Record<Mood, number>> = {}
  for (const { mood } of moods) {
    if (mood) freq[mood] = (freq[mood] ?? 0) + 1
  }
  const entries = Object.entries(freq) as [Mood, number][]
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

// ── Lumi Highlight Card ──────────────────────────────────
function LumiHighlightCard({ highlight }: { highlight: string }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '14px 16px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 500,
        color: '#2D2A3E',
        lineHeight: 1.55,
      }}>
        {highlight}
      </p>
    </div>
  )
}

// ── Activity Calendar ────────────────────────────────────
function ActivityCalendar({ activeDays, moods }: { activeDays: boolean[]; moods: { date: string; mood: Mood | null }[] }) {
  const today = localToday()
  const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '16px 12px 14px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {activeDays.map((active, i) => {
          const mood      = moods[i]?.mood
          const meta      = mood ? MOOD_META[mood] : null
          const isToday   = moods[i]?.date === today
          const isFuture  = i > todayIdx
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '10px',
                fontWeight: 800,
                color: isToday ? '#F4A582' : '#9895B0',
              }}>
                {DAY_SHORT[i]}
              </p>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: isFuture
                  ? 'transparent'
                  : meta
                    ? `${meta.color}22`
                    : active
                      ? 'rgba(244,165,130,0.12)'
                      : 'rgba(45,42,62,0.04)',
                border: `2px solid ${
                  isFuture
                    ? 'rgba(45,42,62,0.06)'
                    : meta
                      ? meta.color
                      : active
                        ? 'rgba(244,165,130,0.35)'
                        : 'rgba(45,42,62,0.10)'
                }`,
                borderStyle: isFuture ? 'dashed' : 'solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: meta ? `0 0 0 3px ${meta.color}18` : 'none',
              }}>
                {/* mood icon if logged, dot if active but no mood, nothing if future */}
                {!isFuture && (meta
                  ? <span style={{ color: meta.color, display: 'flex' }}>{meta.icon}</span>
                  : active
                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(244,165,130,0.6)' }} />
                    : null
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '11px',
        fontWeight: 500,
        color: '#9895B0',
        marginTop: 12,
        paddingLeft: 2,
      }}>
        {activeDays.filter((a, i) => a && i <= todayIdx).length} of {todayIdx + 1} days active this week
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
      letterSpacing: '0.1em', color: '#9895B0', marginBottom: 10,
    }}>
      {children}
    </p>
  )
}

// ── Date Strip ───────────────────────────────────────────
function DateStrip({
  moodDays,
  selectedDate,
  onSelect,
}: {
  moodDays: { date: string; mood: Mood | null }[]
  selectedDate: string | null
  onSelect: (date: string) => void
}) {
  const today = localToday()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 4,
    }}>
      {moodDays.map(({ date, mood }) => {
        const dayNum     = parseInt(date.slice(8), 10)
        const isToday    = date === today
        const isFuture   = date > today
        const isSelected = date === selectedDate && !isFuture
        const meta       = mood ? MOOD_META[mood] : null
        const dotColor   = meta ? meta.color : 'transparent'

        // Derive day letter index from date
        const dow = new Date(date + 'T12:00:00').getDay() // 0=Sun
        const dayLetterIdx = dow === 0 ? 6 : dow - 1
        const dayLetter = DAY_SHORT[dayLetterIdx]

        return (
          <button
            key={date}
            onClick={() => !isFuture && onSelect(date)}
            disabled={isFuture}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px 10px',
              borderRadius: 14,
              border: isSelected
                ? '1.5px solid rgba(244,165,130,0.35)'
                : '1.5px solid transparent',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(245,201,138,0.15), rgba(244,165,130,0.15), rgba(232,160,191,0.10))'
                : 'transparent',
              cursor: isFuture ? 'default' : 'pointer',
              opacity: isFuture ? 0.3 : 1,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {/* Day letter */}
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '10px',
              fontWeight: 800,
              color: '#9895B0',
              letterSpacing: '0.03em',
            }}>
              {dayLetter}
            </span>

            {/* Date number — today gets a peach/gold circle */}
            <span style={{
              fontFamily: 'var(--font-aegora)',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 1,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: isToday
                ? 'linear-gradient(135deg, #F5C98A, #F4A582)'
                : 'transparent',
              color: isToday ? '#fff' : '#1E1C2E',
              boxShadow: isToday ? '0 2px 8px rgba(244,165,130,0.40)' : 'none',
            }}>
              {dayNum}
            </span>

            {/* Mood dot — hide on today (circle is enough) */}
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: meta && !isToday ? dotColor : 'rgba(45,42,62,0.12)',
              opacity: meta && !isToday ? 1 : 0.4,
            }} />
          </button>
        )
      })}
    </div>
  )
}

// ── Day Detail Panel ──────────────────────────────────────
function DayDetailPanel({
  date,
  data,
  loading,
  onClose,
}: {
  date: string
  data: DayDetail | null
  loading: boolean
  onClose: () => void
}) {
  const formatted = (() => {
    const d = new Date(date + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  })()

  return (
    <div style={{
      background: 'white',
      borderRadius: 18,
      border: '1.5px solid rgba(45,42,62,0.07)',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{
          fontFamily: 'var(--font-aegora)',
          fontSize: '18px',
          fontWeight: 500,
          color: '#1E1C2E',
        }}>
          {formatted}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(45,42,62,0.06)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9895B0',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {loading ? (
        /* Shimmer skeleton */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 60, 90].map((w, i) => (
            <div key={i} style={{
              height: 14,
              width: `${w}%`,
              borderRadius: 8,
              background: 'linear-gradient(90deg, rgba(45,42,62,0.06) 25%, rgba(45,42,62,0.10) 50%, rgba(45,42,62,0.06) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }} />
          ))}
          <style>{`
            @keyframes shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Mood row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {data.mood ? (
              <>
                <span style={{ color: data.mood.color, display: 'flex', flexShrink: 0 }}>
                  {MOOD_META[data.mood.value as Mood]?.icon ?? null}
                </span>
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: data.mood.color,
                }}>
                  {data.mood.label}
                </span>
              </>
            ) : (
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: '#9895B0',
              }}>
                No mood logged
              </span>
            )}
          </div>

          {/* One Focus row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {data.oneFocus ? (
              <>
                <span style={{ flexShrink: 0, marginTop: 1 }}>
                  {data.oneFocus.completed ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <defs>
                        <linearGradient id="focusCheckGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F4A582"/>
                          <stop offset="100%" stopColor="#E8A0BF"/>
                        </linearGradient>
                      </defs>
                      <circle cx="8" cy="8" r="7" fill="rgba(244,165,130,0.15)" stroke="url(#focusCheckGrad)" strokeWidth="1.5"/>
                      <path d="M5 8l2.5 2.5 4-4" stroke="url(#focusCheckGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="rgba(45,42,62,0.2)" strokeWidth="1.5"/>
                    </svg>
                  )}
                </span>
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2D2A3E',
                  lineHeight: 1.4,
                }}>
                  {data.oneFocus.task}
                </span>
              </>
            ) : (
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: '#9895B0',
              }}>
                No focus set
              </span>
            )}
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Focus minutes */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(45,42,62,0.04)',
              borderRadius: 99, padding: '5px 10px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="13.5" r="7.5" stroke="#F5C98A" strokeWidth="1.8"/>
                <path d="M12 10V13.8L14.2 15.2" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#2D2A3E' }}>
                {data.focus.minutes} min
              </span>
            </div>

            {/* Tasks */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(45,42,62,0.04)',
              borderRadius: 99, padding: '5px 10px',
            }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#8FAAE0" strokeWidth="1.4"/>
                <path d="M5.5 8l2 2 3-3" stroke="#8FAAE0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#2D2A3E' }}>
                {data.tasks.completed} tasks
              </span>
            </div>

            {/* Captures */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(45,42,62,0.04)',
              borderRadius: 99, padding: '5px 10px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M13 3.5L5.5 13H11.5L10.5 20.5L18.5 11H12.5L13 3.5Z" stroke="#E8A0BF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#2D2A3E' }}>
                {data.captures.total} captures
              </span>
            </div>
          </div>

          {/* Meds row */}
          {data.meds.taken && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="6.5" width="18" height="11" rx="2" stroke="#8FAAE0" strokeWidth="1.8"/>
                <path d="M19 10v4" stroke="#8FAAE0" strokeWidth="2" strokeLinecap="round"/>
                <rect x="3" y="8.5" width="4" height="7" rx="1" fill="#8FAAE0" opacity="0.5"/>
              </svg>
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '12px',
                fontWeight: 500,
                color: '#9895B0',
              }}>
                Meds logged
              </span>
            </div>
          )}

          {/* Reflection */}
          {data.reflection ? (
            <div style={{
              borderLeft: '3px solid #F4A582',
              paddingLeft: 12,
            }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: '#2D2A3E',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}>
                {data.reflection}
              </p>
            </div>
          ) : null}

        </div>
      ) : null}
    </div>
  )
}

// ── Daily Activity Bar Chart ──────────────────────────────
function ActivityChart({ byDay, busiestDay }: { byDay: number[]; busiestDay: string | null }) {
  const max = Math.max(...byDay, 1)
  const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 72, gap: 6, marginBottom: 8 }}>
        {byDay.map((count, i) => {
          const pct    = max > 0 ? (count / max) * 100 : 0
          const isTop  = count === max && count > 0
          const isToday = i === todayIdx
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: `${Math.max(pct, 5)}%`,
                borderRadius: '5px 5px 3px 3px',
                background: isTop
                  ? 'linear-gradient(180deg, #F4A582, #E8A0BF)'
                  : `rgba(232,160,191,${0.15 + (pct / 100) * 0.35})`,
                minHeight: 4,
              }} />
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '10px',
                fontWeight: 800,
                color: isToday ? '#F4A582' : '#9895B0',
                marginTop: 7,
              }}>
                {DAY_SHORT[i]}
              </span>
            </div>
          )
        })}
      </div>
      {busiestDay && (
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>
          Most active on <span style={{ color: '#2D2A3E', fontWeight: 800 }}>{busiestDay}</span>
        </p>
      )}
    </div>
  )
}


// ── Focus Card ───────────────────────────────────────────
function FocusCard({ sessions, minutes }: { sessions: number; minutes: number }) {
  const WEEKLY_GOAL = 120
  const pct = Math.min((minutes / WEEKLY_GOAL) * 100, 100)
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '32px', fontWeight: 500, color: '#1E1C2E', lineHeight: 1 }}>
            {minutes}
          </span>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#9895B0', marginLeft: 4 }}>
            min
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#9895B0' }}>
          {sessions} {sessions === 1 ? 'session' : 'sessions'} this week
        </p>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(45,42,62,0.06)', overflow: 'hidden', marginBottom: 7 }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #8FAAE0, #F4A582)',
          width: `${pct}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>
        {Math.round(pct)}% of a 2-hour weekly goal
      </p>
    </div>
  )
}

// ── Wins Card ────────────────────────────────────────────
function WinsCard({ completedTasks }: { completedTasks: { text: string; created_at: string }[] }) {
  const [expanded, setExpanded] = useState(false)
  const count = completedTasks.length

  const copy = count === 0
    ? "Nothing checked off yet — the week's still young."
    : count === 1
      ? "You completed 1 task this week. That's a start."
      : count <= 5
        ? `You completed ${count} tasks this week. Every one counts.`
        : count <= 10
          ? `${count} tasks done this week. That's real momentum.`
          : `${count} tasks cleared this week. Your brain has been busy.`

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => count > 0 && setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', cursor: count > 0 ? 'pointer' : 'default',
          background: 'white', borderRadius: 20,
          border: '1px solid rgba(45,42,62,0.07)',
          boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}
      >
        {/* Trophy circle */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(245,201,138,0.22), rgba(244,165,130,0.16))',
          border: '1.5px solid rgba(245,201,138,0.38)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 256 256" fill="rgba(200,160,48,0.82)">
            <path d="M232,60H212V48a12,12,0,0,0-12-12H56A12,12,0,0,0,44,48V60H24A20,20,0,0,0,4,80V96a44.05,44.05,0,0,0,44,44h.77A84.18,84.18,0,0,0,116,195.15V212H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24H140V195.11c30.94-4.51,56.53-26.2,67-55.11h1a44.05,44.05,0,0,0,44-44V80A20,20,0,0,0,232,60ZM28,96V84H44v28c0,1.21,0,2.41.09,3.61A20,20,0,0,1,28,96Zm160,15.1c0,33.33-26.71,60.65-59.54,60.9A60,60,0,0,1,68,112V60H188ZM228,96a20,20,0,0,1-16.12,19.62c.08-1.5.12-3,.12-4.52V84h16Z"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
            letterSpacing: '0.08em', color: '#9895B0', marginBottom: 4,
          }}>
            WINS THIS WEEK
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700,
            color: '#1E1C2E', lineHeight: 1.35,
          }}>
            {copy}
          </p>
        </div>

        {/* Chevron */}
        {count > 0 && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" stroke="rgba(45,42,62,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Expandable task list */}
      {expanded && count > 0 && (
        <div style={{
          background: 'white', borderRadius: '0 0 20px 20px',
          border: '1px solid rgba(45,42,62,0.07)',
          borderTop: 'none',
          marginTop: -8, paddingTop: 8,
          overflow: 'hidden',
        }}>
          {completedTasks.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '11px 16px',
              borderTop: '1px solid rgba(45,42,62,0.05)',
            }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <defs>
                  <linearGradient id="taskCheckGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F4A582"/>
                    <stop offset="100%" stopColor="#E8A0BF"/>
                  </linearGradient>
                </defs>
                <circle cx="8" cy="8" r="7" fill="rgba(244,165,130,0.14)" stroke="url(#taskCheckGrad)" strokeWidth="1.4"/>
                <path d="M5 8l2.5 2.5 4-4" stroke="url(#taskCheckGrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600,
                color: '#2D2A3E', flex: 1, lineHeight: 1.4,
              }}>
                {t.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Brain Report card ─────────────────────────────────────
function BrainReportCard({ plan, daysWithData }: { plan: 'free' | 'core' | 'companion'; daysWithData: number }) {
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [report,  setReport]  = useState<string | null>(null)
  const isPaid = plan === 'core' || plan === 'companion'
  const router = useRouter()

  async function generate() {
    setStatus('loading')
    try {
      const res  = await fetch('/api/insights/brain-report', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (!isPaid) {
    return (
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(145deg, #1E1C2E, #2D2A3E)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 4,
      }}>
        <div style={{ padding: '22px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#F4A582', opacity: 0.9 }}>
              WEEKLY BRAIN REPORT
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '20px', fontWeight: 500, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 16 }}>
            Your week, through Lumi&apos;s eyes.
          </p>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500,
              color: 'rgba(245,242,238,0.7)', lineHeight: 1.6,
              filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none',
            }}>
              This week your brain was doing a lot. You captured 23 thoughts — most of them worries and tasks that have been sitting quietly in the back of your mind. Lumi noticed that Tuesday was when everything seemed to bubble up at once.
            </p>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 20%, #1E1C2E 80%)',
            }} />
          </div>
          <div style={{
            background: 'rgba(244,165,130,0.1)',
            border: '1px solid rgba(244,165,130,0.2)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 16,
          }}>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: 'rgba(245,242,238,0.7)', lineHeight: 1.5 }}>
              <span style={{ color: '#F4A582', fontWeight: 800 }}>Lumi noticed a pattern</span> in your week. Upgrade to Core to read your full report.
            </p>
          </div>
          <button onClick={() => router.push('/upgrade')} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800, color: '#1E1C2E',
          }}>
            Unlock with Core — $14/mo
          </button>
          <p style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: 'rgba(245,242,238,0.3)' }}>
            7-day free trial
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'linear-gradient(145deg, #1E1C2E, #2D2A3E)',
      border: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 4,
    }}>
      <div style={{ padding: '22px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#F4A582', opacity: 0.9 }}>
            WEEKLY BRAIN REPORT
          </p>
        </div>

        {status === 'idle' && daysWithData < 3 && (
          <>
            <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '20px', fontWeight: 500, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 10 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 4 }}>
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.55)', lineHeight: 1.6 }}>
                Come back in a few days. Lumi needs more of your week to write something meaningful.
              </p>
            </div>
          </>
        )}

        {status === 'idle' && daysWithData >= 3 && daysWithData < 7 && new Date().getDay() !== 0 && (
          <>
            <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '20px', fontWeight: 500, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 8 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
              Your week isn&apos;t over yet — you can generate an early report or wait until Sunday for the full picture.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generate} style={{
                flex: 1, padding: '13px',
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800, color: '#1E1C2E',
              }}>
                Generate early
              </button>
              <div style={{
                flex: 1, padding: '13px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700,
                color: 'rgba(245,242,238,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                Wait for Sunday
              </div>
            </div>
          </>
        )}

        {status === 'idle' && daysWithData >= 3 && (daysWithData >= 7 || new Date().getDay() === 0) && (
          <>
            <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '20px', fontWeight: 500, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 8 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.5)', lineHeight: 1.5, marginBottom: 18 }}>
              Lumi will read your week — captures, moods, focus sessions — and write a personal summary just for you.
            </p>
            <button onClick={generate} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800, color: '#1E1C2E',
            }}>
              Generate this week&apos;s report
            </button>
          </>
        )}

        {status === 'loading' && (
          <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4A582', animation: 'lumiPulse 1s ease-in-out infinite' }} />
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.6)' }}>
              Lumi is reading your week…
            </p>
          </div>
        )}

        {status === 'done' && report && (
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 500, color: 'rgba(245,242,238,0.85)', lineHeight: 1.7 }}>
            {report}
          </p>
        )}

        {status === 'error' && (
          <div>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: 'rgba(245,242,238,0.5)', marginBottom: 12 }}>
              Something went wrong. Try again?
            </p>
            <button onClick={generate} style={{
              padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: 'rgba(245,242,238,0.6)',
            }}>
              Try again
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes lumiPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </div>
  )
}

// ── Sleep Strip ──────────────────────────────────────────
const SLEEP_Q_COLOR: Record<string, string> = {
  great: '#8FAAE0',
  okay:  '#F5C98A',
  rough: '#E8A0BF',
}
const SLEEP_Q_LABEL: Record<string, string> = {
  great: 'Rested',
  okay:  'Got through it',
  rough: 'Rough night',
}

function SleepStrip({ logs }: { logs: SleepLog[] }) {
  if (logs.length === 0) return null

  const MAX_H    = 9
  const slots: (SleepLog | null)[] = Array(Math.max(0, 7 - logs.length)).fill(null).concat([...logs].sort((a, b) => a.log_date.localeCompare(b.log_date)))
  const avgHours = logs.length > 0 ? logs.reduce((s, l) => s + l.duration, 0) / logs.length : 0
  const avgStr   = avgHours % 1 !== 0 ? `${Math.floor(avgHours)}h 30m` : `${Math.floor(avgHours)}h`

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#9895B0' }}>
          Avg {avgStr} / night
        </span>
        <Link href="/me/sleep" style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 800,
          color: '#8FAAE0', textDecoration: 'none',
          background: 'rgba(143,170,224,0.10)', borderRadius: 8, padding: '4px 8px',
        }}>
          Log sleep →
        </Link>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 68, marginBottom: 8 }}>
        {slots.map((log, i) => {
          if (!log) {
            return (
              <div key={i} style={{ flex: 1, height: '12%', borderRadius: '4px 4px 2px 2px', background: 'rgba(45,42,62,0.05)', minHeight: 4 }} />
            )
          }
          const pct   = Math.min(log.duration / MAX_H, 1)
          const color = log.quality ? SLEEP_Q_COLOR[log.quality] : '#8FAAE0'
          const dow   = new Date(log.log_date + 'T12:00:00').getDay()
          const dayLetter = ['S','M','T','W','T','F','S'][dow]

          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 0 }}>
              <div style={{
                width: '100%',
                height: `${Math.max(pct * 100, 8)}%`,
                borderRadius: '5px 5px 3px 3px',
                background: `linear-gradient(180deg, ${color}, ${color}88)`,
                minHeight: 5,
              }} />
            </div>
          )
        })}
      </div>

      {/* Day labels */}
      <div style={{ display: 'flex', gap: 6 }}>
        {slots.map((log, i) => {
          const dow = log ? new Date(log.log_date + 'T12:00:00').getDay() : null
          const dayLetter = dow !== null ? ['S','M','T','W','T','F','S'][dow] : '·'
          const color = log?.quality ? SLEEP_Q_COLOR[log.quality] : 'transparent'
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, color: log ? '#9895B0' : 'rgba(45,42,62,0.2)' }}>
                {dayLetter}
              </span>
              {log?.quality && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Quality legend */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {Object.entries(SLEEP_Q_LABEL).map(([k, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SLEEP_Q_COLOR[k] }} />
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 600, color: '#9895B0' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data,         setData]         = useState<InsightsData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayData,      setDayData]      = useState<DayDetail | null>(null)
  const [dayLoading,   setDayLoading]   = useState(false)
  const [sleepLogs,    setSleepLogs]    = useState<SleepLog[]>([])

  useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset()
    fetch(`/api/insights?tzOffset=${tzOffset}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
    // Sleep data fetched independently — doesn't block main insights load
    fetch(`/api/sleep?tzOffset=${tzOffset}`)
      .then(r => r.json())
      .then(({ today, history }) => {
        const all = [...(today ? [today] : []), ...(history ?? [])]
        setSleepLogs(all.slice(0, 7))
      })
      .catch(() => {})
  }, [])

  async function handleSelectDate(date: string) {
    // Toggle off if already selected
    if (date === selectedDate) {
      setSelectedDate(null)
      setDayData(null)
      return
    }
    setSelectedDate(date)
    setDayData(null)
    setDayLoading(true)
    try {
      const tzOffset = new Date().getTimezoneOffset()
      const res = await fetch(`/api/insights/day?date=${date}&tzOffset=${tzOffset}`)
      const json = await res.json()
      setDayData(json)
    } catch {
      setDayData(null)
    } finally {
      setDayLoading(false)
    }
  }

  const weekLabel    = data ? formatWeekRange(data.week.start, data.week.end) : '—'
  const topMood      = data ? dominantMood(data.moods) : null
  // Days with at least one capture OR a mood logged
  const daysWithData = data
    ? data.captures.byDay.filter((n, i) => n > 0 || data.moods[i]?.mood != null).length
    : 0
  const hasNoData = data
    ? data.captures.total === 0 && data.focus.sessions === 0 && data.moods.every(m => !m.mood)
    : false

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'radial-gradient(ellipse 100% 55% at 100% 0%, rgba(244,165,130,0.28) 0%, transparent 62%), radial-gradient(ellipse 100% 55% at 0% 0%, rgba(245,201,138,0.20) 0%, transparent 62%), #FBF8F5' }}>

      {/* Body */}
      <div className="lumi-insights-body flex flex-col flex-1 px-5 pb-8" style={{ paddingTop: 24, gap: 24, display: 'flex', flexDirection: 'column' }}>

        {/* Date strip — always render once data loaded */}
        {!loading && data && (
          <>
            <DateStrip
              moodDays={data.moods as { date: string; mood: Mood | null }[]}
              selectedDate={selectedDate}
              onSelect={handleSelectDate}
            />

            {/* Day detail panel */}
            {selectedDate && (
              <DayDetailPanel
                date={selectedDate}
                data={dayData}
                loading={dayLoading}
                onClose={() => { setSelectedDate(null); setDayData(null) }}
              />
            )}
          </>
        )}

        {/* Week label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: -8 }}>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>
            {weekLabel}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4A582', animation: 'lumiPulse 1s ease-in-out infinite' }} />
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: '#9895B0' }}>
              Loading your week…
            </p>
            <style>{`
              @keyframes lumiPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(0.7); }
              }
            `}</style>
          </div>
        ) : data ? (
          <>
            {hasNoData ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '40px 20px 36px',
                background: 'white', borderRadius: 20,
                border: '1px solid rgba(45,42,62,0.07)',
                textAlign: 'center',
                marginTop: 8,
              }}>
                {/* Lumi brandmark sun — inline */}
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  boxShadow: '0 4px 20px rgba(244,165,130,0.35)',
                }}>
                  <svg width="34" height="31" viewBox="0 0 166.9 151.3" fill="none">
                    <circle cx="83.8" cy="91" r="37.5" fill="white" />
                    <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white" />
                    <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9" fill="white" />
                    <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white" />
                    <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white" />
                    <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white" />
                    <rect x="10" y="133.4" width="147.6" height="7.9" rx="3.1" ry="3.1" fill="white" opacity="0.72" />
                  </svg>
                </div>
                <p style={{
                  fontFamily: 'var(--font-aegora)', fontSize: '20px', fontWeight: 500,
                  color: '#1E1C2E', marginBottom: 10, lineHeight: 1.2,
                }}>
                  Your insights are on their way
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500,
                  color: '#9895B0', lineHeight: 1.65, maxWidth: '240px',
                }}>
                  Log a mood, dump some thoughts, run a focus session. Come back in a few days and Lumi will start seeing patterns.
                </p>
              </div>
            ) : (
            <>
            <div className="lumi-insights-layout">
            <div className="lumi-insights-left">
            {/* ── Stat cards ── */}
            <div>
              <SectionLabel>THIS WEEK</SectionLabel>
              <WinsCard completedTasks={data.captures.completedTasks} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>

                {/* Captures */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <path d="M13 3.5L5.5 13H11.5L10.5 20.5L18.5 11H12.5L13 3.5Z" stroke="#E8A0BF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, color: '#9895B0', letterSpacing: '0.04em' }}>CAPTURES</p>
                  <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '26px', fontWeight: 500, color: '#1E1C2E', lineHeight: 1 }}>{data.captures.total}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>thoughts this week</p>
                </div>

                {/* Focus */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="13.5" r="7.5" stroke="#F5C98A" strokeWidth="1.8"/>
                    <path d="M12 10V13.8L14.2 15.2" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 3H14.5" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M12 3V5.5" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, color: '#9895B0', letterSpacing: '0.04em' }}>FOCUS TIME</p>
                  <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '26px', fontWeight: 500, color: '#1E1C2E', lineHeight: 1 }}>
                    {data.focus.minutes}<span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#9895B0' }}> min</span>
                  </p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>{data.focus.sessions} {data.focus.sessions === 1 ? 'session' : 'sessions'}</p>
                </div>

                {/* Tasks done */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="12" r="8.5" stroke="#8FAAE0" strokeWidth="1.8"/>
                    <path d="M8.5 12L11 14.5L15.5 9.5" stroke="#8FAAE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, color: '#9895B0', letterSpacing: '0.04em' }}>TASKS DONE</p>
                  <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '26px', fontWeight: 500, color: '#1E1C2E', lineHeight: 1 }}>{data.captures.completedTasks.length}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>completed</p>
                </div>

                {/* Top mood */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="12" r="8.5" stroke="#F4A582" strokeWidth="1.8"/>
                    <path d="M9 13.5C9 13.5 10.2 15 12 15C13.8 15 15 13.5 15 13.5" stroke="#F4A582" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="9.5" cy="10.5" r="1" fill="#F4A582"/>
                    <circle cx="14.5" cy="10.5" r="1" fill="#F4A582"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, color: '#9895B0', letterSpacing: '0.04em' }}>TOP MOOD</p>
                  <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '22px', fontWeight: 500, color: topMood ? MOOD_META[topMood].color : '#1E1C2E', lineHeight: 1 }}>{topMood ? MOOD_META[topMood].label : '—'}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>most logged</p>
                </div>

              </div>
            </div>

            {/* ── Lumi highlight ── */}
            <LumiHighlightCard highlight={data.highlight} />

            {/* ── Weekly Brain Report ── */}
            <div>
              <SectionLabel>WEEKLY BRAIN REPORT</SectionLabel>
              <BrainReportCard plan={data.plan} daysWithData={daysWithData} />
            </div>

            </div>{/* end lumi-insights-left */}
            <div className="lumi-insights-right">

            {/* ── Daily activity chart ── */}
            <div>
              <SectionLabel>DAILY ACTIVITY</SectionLabel>
              <ActivityChart byDay={data.captures.byDay} busiestDay={data.captures.busiestDay} />
            </div>

            {/* ── Activity calendar + mood ── */}
            <div>
              <SectionLabel>YOUR WEEK</SectionLabel>
              <ActivityCalendar activeDays={data.activeDays} moods={data.moods} />
            </div>

            {/* ── Focus time ── */}
            {data.focus.sessions > 0 && (
              <div>
                <SectionLabel>FOCUS TIME</SectionLabel>
                <FocusCard sessions={data.focus.sessions} minutes={data.focus.minutes} />
              </div>
            )}

            {/* ── Sleep ── */}
            {sleepLogs.length > 0 && (
              <div>
                <SectionLabel>SLEEP</SectionLabel>
                <SleepStrip logs={sleepLogs} />
              </div>
            )}

            {/* ── Captures by type ── */}
            {data.captures.total > 0 && (
              <div>
                <SectionLabel>CAPTURES BY TYPE</SectionLabel>
                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)' }}>
                  {(Object.entries(TAG_META) as [keyof typeof TAG_META, typeof TAG_META[keyof typeof TAG_META]][]).map(([key, meta]) => {
                    const count = data.captures.byTag[key]
                    const pct   = data.captures.total > 0 ? (count / data.captures.total) * 100 : 0
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#2D2A3E' }}>{meta.label}</span>
                          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0' }}>{count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: 'rgba(45,42,62,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: meta.color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            </div>
            </div>

            <ResourcesSection desktop />
            </>

            )}
          </>
        ) : (
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: '#9895B0' }}>
            Couldn&apos;t load insights. Try refreshing.
          </p>
        )}
      </div>
    </div>
  )
}
