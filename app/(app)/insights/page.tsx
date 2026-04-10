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
  task:     { label: 'Tasks',     color: '#F4A582', bg: 'rgba(244,165,130,0.12)' },
  idea:     { label: 'Ideas',     color: '#F5C98A', bg: 'rgba(245,201,138,0.12)' },
  worry:    { label: 'Worries',   color: '#E8A0BF', bg: 'rgba(232,160,191,0.12)' },
  reminder: { label: 'Reminders', color: '#8FAAE0', bg: 'rgba(143,170,224,0.12)' },
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

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px',
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', fontWeight: 900, color: '#1E1C2E', lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: '#9895B0' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
      letterSpacing: '0.1em', color: '#9895B0', marginBottom: 12,
    }}>
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────
// Brain Report card
// ─────────────────────────────────────────────────────────

function BrainReportCard({ plan }: { plan: 'free' | 'starter' | 'core' | 'companion' }) {
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

  // ── Locked (free) ──
  if (!isPaid) {
    return (
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(145deg, #1E1C2E, #2D2A3E)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 24,
      }}>
        <div style={{ padding: '22px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#F4A582', opacity: 0.9 }}>
              WEEKLY BRAIN REPORT
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 16 }}>
            Your week, through Lumi's eyes.
          </p>

          {/* Blurred preview */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600,
              color: 'rgba(245,242,238,0.7)', lineHeight: 1.6,
              filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none',
            }}>
              This week your brain was doing a lot. You captured 23 thoughts — most of them worries and tasks that have been sitting quietly in the back of your mind. Lumi noticed that Tuesday was when everything seemed to bubble up at once, which makes sense given what you've been carrying. Your two focus sessions show something important: you're still showing up, even when it's hard.
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

          <button
            onClick={() => router.push('/upgrade')}
            style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800,
            color: '#1E1C2E',
          }}>
            Unlock with Core — $29/mo
          </button>
          <p style={{
            textAlign: 'center', marginTop: 8,
            fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
            fontWeight: 600, color: 'rgba(245,242,238,0.3)',
          }}>
            7-day free trial
          </p>
        </div>
      </div>
    )
  }

  // ── Unlocked (core / companion) ──
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'linear-gradient(145deg, #1E1C2E, #2D2A3E)',
      border: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 24,
    }}>
      <div style={{ padding: '22px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#F4A582', opacity: 0.9 }}>
            WEEKLY BRAIN REPORT
          </p>
        </div>

        {status === 'idle' && (
          <>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 900, color: '#F5F2EE', lineHeight: 1.2, marginBottom: 8 }}>
              Your week, through Lumi's eyes.
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.5)', lineHeight: 1.5, marginBottom: 18 }}>
              Lumi will read your week — captures, moods, focus sessions — and write a personal summary just for you.
            </p>
            <button
              onClick={generate}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800,
                color: '#1E1C2E',
              }}
            >
              Generate this week's report
            </button>
          </>
        )}

        {status === 'loading' && (
          <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#F4A582',
              animation: 'lumiPulse 1s ease-in-out infinite',
            }} />
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.6)' }}>
              Lumi is reading your week…
            </p>
          </div>
        )}

        {status === 'done' && report && (
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600,
            color: 'rgba(245,242,238,0.85)', lineHeight: 1.7,
          }}>
            {report}
          </p>
        )}

        {status === 'error' && (
          <div>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: 'rgba(245,242,238,0.5)', marginBottom: 12 }}>
              Something went wrong. Try again?
            </p>
            <button
              onClick={generate}
              style={{
                padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700,
                color: 'rgba(245,242,238,0.6)',
              }}
            >
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
    fetch('/api/insights')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const weekLabel = data ? formatWeekRange(data.week.start, data.week.end) : '—'
  const topMood   = data ? dominantMood(data.moods) : null

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── White header ── */}
      <div style={{ background: '#ffffff', padding: '32px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-fraunces)', fontSize: '34px',
              fontWeight: 900, color: '#1E1C2E', lineHeight: 1.1, marginBottom: 4,
            }}>
              Insights
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: '#9895B0' }}>
              {weekLabel}
            </p>
          </div>
          <ProfileButton />
        </div>
      </div>

      {/* ── Beige body ── */}
      <div className="flex flex-col flex-1 px-5 pb-6" style={{ background: '#FBF8F5', paddingTop: 24 }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#F4A582',
              animation: 'lumiPulse 1s ease-in-out infinite',
            }} />
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
            {/* Stat cards — 2×2 grid */}
            <SectionLabel>THIS WEEK</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              <StatCard
                icon="🧠"
                label="CAPTURES"
                value={String(data.captures.total)}
                sub={data.captures.total === 1 ? 'thought captured' : 'thoughts captured'}
              />
              <StatCard
                icon="⏱"
                label="FOCUS"
                value={String(data.focus.sessions)}
                sub={data.focus.sessions === 1 ? 'session' : `sessions · ${data.focus.minutes} min`}
              />
              <StatCard
                icon="📅"
                label="BUSIEST DAY"
                value={data.captures.busiestDay ? data.captures.busiestDay.slice(0, 3) : '—'}
                sub={data.captures.busiestDay ?? 'no captures yet'}
              />
              <StatCard
                icon={topMood ? MOOD_META[topMood].emoji : '—'}
                label="TOP MOOD"
                value={topMood ? MOOD_META[topMood].label : '—'}
                sub={topMood ? 'most checked-in' : 'none logged yet'}
              />
            </div>

            {/* Weekly Brain Report */}
            <BrainReportCard plan={data.plan} />

            {/* Capture breakdown */}
            {data.captures.total > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionLabel>CAPTURES BY TYPE</SectionLabel>
                <div style={{
                  background: 'white', borderRadius: 16, padding: '16px',
                  border: '1px solid rgba(45,42,62,0.07)',
                  boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
                }}>
                  {(Object.entries(TAG_META) as [keyof typeof TAG_META, typeof TAG_META[keyof typeof TAG_META]][]).map(([key, meta]) => {
                    const count = data.captures.byTag[key]
                    const pct   = data.captures.total > 0 ? (count / data.captures.total) * 100 : 0
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#2D2A3E' }}>
                            {meta.label}
                          </span>
                          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: '#9895B0' }}>
                            {count}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: 'rgba(45,42,62,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            background: meta.color,
                            width: `${pct}%`,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mood strip */}
            <div>
              <SectionLabel>MOOD THIS WEEK</SectionLabel>
              <div style={{
                background: 'white', borderRadius: 16, padding: '16px 12px',
                border: '1px solid rgba(45,42,62,0.07)',
                boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
                display: 'flex', justifyContent: 'space-between',
              }}>
                {data.moods.map((d, i) => {
                  const isToday = d.date === new Date().toISOString().slice(0, 10)
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
                        width: 32, height: 32, borderRadius: '50%',
                        background: meta ? meta.color : 'rgba(45,42,62,0.06)',
                        border: `2px solid ${meta ? meta.color : 'rgba(45,42,62,0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                        boxShadow: meta ? `0 0 0 3px ${meta.color}22` : 'none',
                      }}>
                        {meta ? meta.emoji : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: '#9895B0' }}>
            Couldn't load insights. Try refreshing.
          </p>
        )}
      </div>
    </div>
  )
}
