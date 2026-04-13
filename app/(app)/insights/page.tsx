'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileButton from '../_components/ProfileButton'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Mood = 'foggy' | 'okay' | 'wired' | 'drained'

interface InsightsData {
  plan: 'free' | 'starter' | 'core' | 'companion'
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
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const MOOD_META: Record<Mood, { emoji: string; label: string; color: string }> = {
  foggy:   { emoji: '🌫️', label: 'Foggy',   color: '#8FAAE0' },
  okay:    { emoji: '😌', label: 'Okay',    color: '#5EC269' },
  wired:   { emoji: '⚡', label: 'Wired',   color: '#F5C98A' },
  drained: { emoji: '🪫', label: 'Drained', color: '#E8A0BF' },
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
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>
          Most active on <span style={{ color: '#2D2A3E', fontWeight: 800 }}>{busiestDay}</span>
        </p>
      )}
    </div>
  )
}

// ── Mood Strip ───────────────────────────────────────────
function MoodStrip({ moods }: { moods: { date: string; mood: Mood | null }[] }) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px 12px 14px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {moods.map((d, i) => {
          const isToday = d.date === today
          const meta    = d.mood ? MOOD_META[d.mood] : null
          return (
            <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
                color: isToday ? '#F4A582' : '#9895B0',
              }}>
                {DAY_SHORT[i]}
              </p>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: meta ? `${meta.color}22` : 'rgba(45,42,62,0.05)',
                border: `2px solid ${meta ? meta.color : 'rgba(45,42,62,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
                boxShadow: meta ? `0 0 0 3px ${meta.color}18` : 'none',
              }}>
                {meta ? meta.emoji : ''}
              </div>
            </div>
          )
        })}
      </div>
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
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>
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
      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>
        {Math.round(pct)}% of a 2-hour weekly goal
      </p>
    </div>
  )
}

// ── Brain Report card ─────────────────────────────────────
function BrainReportCard({ plan, daysWithData }: { plan: 'free' | 'starter' | 'core' | 'companion'; daysWithData: number }) {
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
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 16 }}>
            Your week, through Lumi&apos;s eyes.
          </p>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600,
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
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: 'rgba(245,242,238,0.7)', lineHeight: 1.5 }}>
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
          <p style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: 'rgba(245,242,238,0.3)' }}>
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
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 10 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 4 }}>
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.55)', lineHeight: 1.6 }}>
                Come back in a few days. Lumi needs more of your week to write something meaningful.
              </p>
            </div>
          </>
        )}

        {status === 'idle' && daysWithData >= 3 && daysWithData < 7 && (
          <>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 8 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
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

        {status === 'idle' && daysWithData >= 7 && (
          <>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 8 }}>
              Your week, through Lumi&apos;s eyes.
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.5)', lineHeight: 1.5, marginBottom: 18 }}>
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
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.6)' }}>
              Lumi is reading your week…
            </p>
          </div>
        )}

        {status === 'done' && report && (
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600, color: 'rgba(245,242,238,0.85)', lineHeight: 1.7 }}>
            {report}
          </p>
        )}

        {status === 'error' && (
          <div>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.5)', marginBottom: 12 }}>
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

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data,    setData]    = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset()
    fetch(`/api/insights?tzOffset=${tzOffset}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const weekLabel    = data ? formatWeekRange(data.week.start, data.week.end) : '—'
  const topMood      = data ? dominantMood(data.moods) : null
  // Days with at least one capture OR a mood logged
  const daysWithData = data
    ? data.captures.byDay.filter((n, i) => n > 0 || data.moods[i]?.mood != null).length
    : 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(45,42,62,0.06)' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>
          Insights
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>
            {weekLabel}
          </span>
          <ProfileButton />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-5 pb-8" style={{ background: '#FBF8F5', paddingTop: 24, gap: 24, display: 'flex', flexDirection: 'column' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4A582', animation: 'lumiPulse 1s ease-in-out infinite' }} />
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#9895B0' }}>
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
            {/* ── Stat cards ── */}
            <div>
              <SectionLabel>THIS WEEK</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

                {/* Captures */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <path d="M13 3.5L5.5 13H11.5L10.5 20.5L18.5 11H12.5L13 3.5Z" stroke="#E8A0BF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 700, color: '#9895B0', letterSpacing: '0.04em' }}>CAPTURES</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>{data.captures.total}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>thoughts this week</p>
                </div>

                {/* Focus */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="13.5" r="7.5" stroke="#F5C98A" strokeWidth="1.8"/>
                    <path d="M12 10V13.8L14.2 15.2" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 3H14.5" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M12 3V5.5" stroke="#F5C98A" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 700, color: '#9895B0', letterSpacing: '0.04em' }}>FOCUS TIME</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>
                    {data.focus.minutes}<span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700, color: '#9895B0' }}> min</span>
                  </p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>{data.focus.sessions} {data.focus.sessions === 1 ? 'session' : 'sessions'}</p>
                </div>

                {/* Tasks done */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="12" r="8.5" stroke="#8FAAE0" strokeWidth="1.8"/>
                    <path d="M8.5 12L11 14.5L15.5 9.5" stroke="#8FAAE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 700, color: '#9895B0', letterSpacing: '0.04em' }}>TASKS DONE</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '26px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>{data.captures.completedTasks.length}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>completed</p>
                </div>

                {/* Top mood */}
                <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 2 }}>
                    <circle cx="12" cy="12" r="8.5" stroke="#F4A582" strokeWidth="1.8"/>
                    <path d="M9 13.5C9 13.5 10.2 15 12 15C13.8 15 15 13.5 15 13.5" stroke="#F4A582" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="9.5" cy="10.5" r="1" fill="#F4A582"/>
                    <circle cx="14.5" cy="10.5" r="1" fill="#F4A582"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 700, color: '#9895B0', letterSpacing: '0.04em' }}>TOP MOOD</p>
                  <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>{topMood ? MOOD_META[topMood].label : '—'}</p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>most logged</p>
                </div>

              </div>
            </div>

            {/* ── Weekly Brain Report ── */}
            <div>
              <SectionLabel>WEEKLY BRAIN REPORT</SectionLabel>
              <BrainReportCard plan={data.plan} daysWithData={daysWithData} />
            </div>

            {/* ── Daily activity chart ── */}
            <div>
              <SectionLabel>DAILY ACTIVITY</SectionLabel>
              <ActivityChart byDay={data.captures.byDay} busiestDay={data.captures.busiestDay} />
            </div>

            {/* ── Mood strip ── */}
            <div>
              <SectionLabel>MOOD THIS WEEK</SectionLabel>
              <MoodStrip moods={data.moods} />
            </div>

            {/* ── Focus time ── */}
            {data.focus.sessions > 0 && (
              <div>
                <SectionLabel>FOCUS TIME</SectionLabel>
                <FocusCard sessions={data.focus.sessions} minutes={data.focus.minutes} />
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

            {/* ── Completed tasks ── */}
            {data.captures.completedTasks.length > 0 && (
              <div>
                <SectionLabel>COMPLETED THIS WEEK</SectionLabel>
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(45,42,62,0.07)', boxShadow: '0 2px 8px rgba(45,42,62,0.06)', overflow: 'hidden' }}>
                  {data.captures.completedTasks.map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                      borderBottom: i < data.captures.completedTasks.length - 1 ? '1px solid rgba(45,42,62,0.05)' : 'none',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="8" cy="8" r="7" fill="rgba(94,194,105,0.15)" stroke="#5EC269" strokeWidth="1.5"/>
                        <path d="M5 8l2.5 2.5 4-4" stroke="#5EC269" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#2D2A3E', lineHeight: 1.4, marginBottom: 2 }}>{t.text}</p>
                        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 600, color: '#9895B0' }}>
                          {new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#9895B0' }}>
            Couldn&apos;t load insights. Try refreshing.
          </p>
        )}
      </div>
    </div>
  )
}
