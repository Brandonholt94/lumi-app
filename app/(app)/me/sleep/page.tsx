'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { SleepLog } from '@/app/api/sleep/route'

// ─── Design tokens — dark sleep mode ─────────────────────────────────────────
const D = {
  bg:     '#0D0C1A',
  card:   'rgba(255,255,255,0.06)',
  bdr:    'rgba(255,255,255,0.09)',
  text:   'rgba(245,242,238,0.92)',
  muted:  'rgba(245,242,238,0.45)',
  faint:  'rgba(245,242,238,0.18)',
  indigo: '#8FAAE0',
  violet: '#B8AECC',
  peach:  '#F4A582',
  gold:   '#F5C98A',
  green:  '#5EC269',
}

// ─── Stars (static positions — no Math.random to avoid hydration mismatch) ───
const STARS: { x: number; y: number; size: number; opacity: number; dur: number; delay: number }[] = [
  { x:  5, y:  6, size: 1.5, opacity: 0.65, dur: 3.1, delay: 0.0 },
  { x: 18, y: 12, size: 1.0, opacity: 0.45, dur: 2.7, delay: 0.8 },
  { x: 33, y:  4, size: 1.2, opacity: 0.55, dur: 3.6, delay: 0.3 },
  { x: 52, y:  9, size: 1.0, opacity: 0.40, dur: 2.4, delay: 1.2 },
  { x: 71, y:  5, size: 1.5, opacity: 0.60, dur: 3.9, delay: 0.6 },
  { x: 87, y: 14, size: 1.0, opacity: 0.50, dur: 2.8, delay: 1.5 },
  { x: 94, y:  3, size: 1.2, opacity: 0.45, dur: 3.3, delay: 0.2 },
  { x:  9, y: 24, size: 1.0, opacity: 0.35, dur: 4.1, delay: 1.0 },
  { x: 42, y: 19, size: 1.5, opacity: 0.55, dur: 2.6, delay: 0.4 },
  { x: 63, y: 22, size: 1.0, opacity: 0.40, dur: 3.4, delay: 1.8 },
  { x: 78, y: 17, size: 1.2, opacity: 0.50, dur: 2.9, delay: 0.7 },
  { x: 91, y: 28, size: 1.0, opacity: 0.35, dur: 3.7, delay: 1.3 },
  { x: 22, y: 33, size: 1.5, opacity: 0.45, dur: 3.2, delay: 2.1 },
  { x: 56, y: 38, size: 1.0, opacity: 0.30, dur: 4.4, delay: 0.9 },
  { x: 82, y: 42, size: 1.2, opacity: 0.40, dur: 2.5, delay: 1.6 },
  { x:  3, y: 48, size: 1.0, opacity: 0.35, dur: 3.8, delay: 0.1 },
  { x: 14, y: 55, size: 1.5, opacity: 0.50, dur: 2.7, delay: 2.4 },
  { x: 37, y: 52, size: 1.0, opacity: 0.30, dur: 3.5, delay: 1.1 },
  { x: 68, y: 58, size: 1.2, opacity: 0.45, dur: 4.0, delay: 0.5 },
  { x: 89, y: 51, size: 1.0, opacity: 0.35, dur: 2.9, delay: 1.9 },
  { x: 48, y: 65, size: 1.5, opacity: 0.40, dur: 3.3, delay: 0.8 },
  { x:  7, y: 72, size: 1.0, opacity: 0.30, dur: 4.2, delay: 2.2 },
  { x: 26, y: 78, size: 1.2, opacity: 0.35, dur: 3.0, delay: 0.3 },
  { x: 75, y: 71, size: 1.0, opacity: 0.40, dur: 2.6, delay: 1.7 },
  { x: 93, y: 68, size: 1.5, opacity: 0.45, dur: 3.6, delay: 0.6 },
]

// ─── Clock math ───────────────────────────────────────────────────────────────
const SZ = 280
const C  = SZ / 2
const R  = 108
const HR = 18

function h2a(h: number)  { return (h / 24) * 360 }
function a2h(a: number)  {
  const raw = ((a / 360) * 24 + 24) % 24
  return Math.round(raw * 2) / 2
}
function polar(deg: number, r: number): [number, number] {
  const rad = (deg - 90) * (Math.PI / 180)
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)]
}
function arcD(a1: number, a2: number, r: number) {
  const [x1, y1] = polar(a1, r)
  const [x2, y2] = polar(a2, r)
  let span = a2 - a1; if (span < 0) span += 360
  return `M${x1},${y1} A${r},${r} 0 ${span > 180 ? 1 : 0} 1 ${x2},${y2}`
}

function fmt(h: number) {
  const h24  = Math.floor(h)
  const min  = h % 1 !== 0 ? '30' : '00'
  const ampm = h24 >= 12 ? 'pm' : 'am'
  const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return `${h12}:${min} ${ampm}`
}
function durStr(bed: number, wake: number) {
  let d = wake - bed; if (d <= 0) d += 24
  const h = Math.floor(d), half = d % 1 !== 0
  return half ? `${h}h 30m` : `${h}h`
}
function durNum(bed: number, wake: number) {
  let d = wake - bed; if (d <= 0) d += 24
  return d
}

// ─── Clock labels ─────────────────────────────────────────────────────────────
const MAJOR       = [{ hour: 0, label: '12am' }, { hour: 6, label: '6am' }, { hour: 12, label: '12pm' }, { hour: 18, label: '6pm' }]
const MINOR_HOURS = [3, 9, 15, 21]

// ─── Icons ────────────────────────────────────────────────────────────────────
function Moon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="white">
      <path d="M244,96a12,12,0,0,1-12,12H220v12a12,12,0,0,1-24,0V108H184a12,12,0,0,1,0-24h12V72a12,12,0,0,1,24,0V84h12A12,12,0,0,1,244,96ZM144,60h4v4a12,12,0,0,0,24,0V60h4a12,12,0,0,0,0-24h-4V32a12,12,0,0,0-24,0v4h-4a12,12,0,0,0,0,24Zm75.81,90.38A12,12,0,0,1,222,162.3,100,100,0,1,1,93.7,34a12,12,0,0,1,15.89,13.6A85.12,85.12,0,0,0,108,64a84.09,84.09,0,0,0,84,84,85.22,85.22,0,0,0,16.37-1.59A12,12,0,0,1,219.81,150.38ZM190,172A108.13,108.13,0,0,1,84,66,76,76,0,1,0,190,172Z"/>
    </svg>
  )
}
function Sun({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="white">
      <path d="M116,36V20a12,12,0,0,1,24,0V36a12,12,0,0,1-24,0Zm80,92a68,68,0,1,1-68-68A68.07,68.07,0,0,1,196,128Zm-24,0a44,44,0,1,0-44,44A44.05,44.05,0,0,0,172,128ZM51.51,68.49a12,12,0,1,0,17-17l-12-12a12,12,0,0,0-17,17Zm0,119-12,12a12,12,0,0,0,17,17l12-12a12,12,0,1,0-17-17ZM196,72a12,12,0,0,0,8.49-3.51l12-12a12,12,0,0,0-17-17l-12,12A12,12,0,0,0,196,72Zm8.49,115.51a12,12,0,0,0-17,17l12,12a12,12,0,0,0,17-17ZM48,128a12,12,0,0,0-12-12H20a12,12,0,0,0,0,24H36A12,12,0,0,0,48,128Zm80,80a12,12,0,0,0-12,12v16a12,12,0,0,0,24,0V220A12,12,0,0,0,128,208Zm108-92H220a12,12,0,0,0,0,24h16a12,12,0,0,0,0-24Z"/>
    </svg>
  )
}

// ─── Quality ──────────────────────────────────────────────────────────────────
const QUALITY = [
  { value: 'great', label: 'Rested',        desc: 'Woke up feeling good'   },
  { value: 'okay',  label: 'Got through it', desc: 'Managed but tired'      },
  { value: 'rough', label: 'Rough night',    desc: 'Running on fumes'       },
]

const QUALITY_COLOR: Record<string, string> = {
  great: '#8FAAE0',
  okay:  '#F5C98A',
  rough: '#E8A0BF',
}

// ─── History bar chart ────────────────────────────────────────────────────────
function SleepHistoryChart({ history, today }: { history: SleepLog[]; today: SleepLog | null }) {
  // Build last-7-nights array in chronological order (oldest → newest)
  // We want to show tonight's slot even if not yet logged
  const allLogs = today ? [today, ...history].slice(0, 7) : [...history].slice(0, 7)
  // Sort oldest → newest
  const sorted  = [...allLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))

  const MAX_H    = 9   // 9h = full bar height
  const barCount = 7

  // Pad to 7 slots (empty on left if < 7 logs)
  const slots: (SleepLog | null)[] = Array(barCount - sorted.length).fill(null).concat(sorted as (SleepLog | null)[])

  if (allLogs.length === 0) return null

  return (
    <div style={{ padding: '0 20px', marginBottom: 32 }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: '10px',
        fontWeight: 800, letterSpacing: '0.1em', color: D.muted,
        marginBottom: 14, paddingLeft: 2,
      }}>
        LAST 7 NIGHTS
      </p>

      <div style={{
        background: D.card, borderRadius: 16, border: `1px solid ${D.bdr}`,
        padding: '16px 16px 12px',
      }}>
        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginBottom: 8 }}>
          {slots.map((log, i) => {
            if (!log) {
              return (
                <div key={i} style={{ flex: 1, height: '20%', borderRadius: '4px 4px 2px 2px', background: 'rgba(255,255,255,0.05)', minHeight: 4 }} />
              )
            }
            const dur   = log.duration
            const pct   = Math.min(dur / MAX_H, 1)
            const color = log.quality ? QUALITY_COLOR[log.quality] : D.indigo
            const isToday = log === today || (today && log.log_date === today.log_date)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 }}>
                {/* duration label on tallest / today */}
                {(isToday || dur >= MAX_H * 0.85) && (
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 800, color: D.muted }}>
                    {Math.floor(dur)}h
                  </span>
                )}
                <div style={{
                  width: '100%',
                  height: `${Math.max(pct * 100, 8)}%`,
                  borderRadius: '5px 5px 3px 3px',
                  background: isToday
                    ? `linear-gradient(180deg, ${color}, ${color}88)`
                    : `${color}55`,
                  border: isToday ? `1px solid ${color}88` : 'none',
                  minHeight: 4,
                  transition: 'height 0.4s ease',
                }} />
              </div>
            )
          })}
        </div>

        {/* Quality legend */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[
            { label: 'Rested', color: '#8FAAE0' },
            { label: 'Got through it', color: '#F5C98A' },
            { label: 'Rough night', color: '#E8A0BF' },
          ].map(q => (
            <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: q.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 600, color: D.muted }}>
                {q.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SleepPage() {
  const [bedtime,   setBedtime]   = useState(22)
  const [wakeTime,  setWakeTime]  = useState(6.5)
  const [quality,   setQuality]   = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [isUpdate,  setIsUpdate]  = useState(false)
  const [history,   setHistory]   = useState<SleepLog[]>([])
  const [todayLog,  setTodayLog]  = useState<SleepLog | null>(null)
  const [loaded,    setLoaded]    = useState(false)

  const svgRef      = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<'bed' | 'wake' | null>(null)

  // ── Load previous sleep data ──────────────────────────────────────────────
  useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset()
    fetch(`/api/sleep?tzOffset=${tzOffset}`)
      .then(r => r.json())
      .then(({ today, history: hist }) => {
        setHistory(hist ?? [])
        if (today) {
          // Already logged today — pre-fill everything
          setTodayLog(today)
          setBedtime(today.bedtime_hour)
          setWakeTime(today.wake_hour)
          setQuality(today.quality ?? null)
          setIsUpdate(true)
        } else if (hist && hist.length > 0) {
          // Use last night's times as sensible defaults (quality always resets)
          setBedtime(hist[0].bedtime_hour)
          setWakeTime(hist[0].wake_hour)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // ── Global drag ───────────────────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current || !svgRef.current) return
      const rect  = svgRef.current.getBoundingClientRect()
      const scale = SZ / rect.width
      const x = (e.clientX - rect.left) * scale - C
      const y = (e.clientY - rect.top)  * scale - C
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90
      if (angle < 0) angle += 360
      const hour = a2h(angle)
      if (draggingRef.current === 'bed')  setBedtime(hour)
      else                                setWakeTime(hour)
    }
    function onUp() { draggingRef.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const tzOffset = new Date().getTimezoneOffset()
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtime_hour: bedtime, wake_hour: wakeTime, quality, tzOffset }),
      })
      if (res.ok) {
        const updated: SleepLog = await res.json()
        setTodayLog(updated)
        setIsUpdate(true)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const bedAngle            = h2a(bedtime)
  const wakeAngle           = h2a(wakeTime)
  const [bedHx,  bedHy]    = polar(bedAngle,  R)
  const [wakeHx, wakeHy]   = polar(wakeAngle, R)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: D.bg, paddingBottom: 48, position: 'relative' }}>

      {/* ── Background: stars + bottom-left gradient glow ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <style>{`
          @keyframes starFlicker {
            0%, 100% { opacity: var(--s-op); transform: scale(1); }
            50%       { opacity: calc(var(--s-op) * 0.25); transform: scale(0.8); }
          }
        `}</style>

        {/* Bottom-left peach → rose glow */}
        <div style={{
          position: 'absolute',
          bottom: -60, left: -60,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,165,130,0.22) 0%, rgba(232,160,191,0.14) 45%, transparent 72%)',
          filter: 'blur(32px)',
        }} />

        {/* Stars */}
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top:  `${s.y}%`,
              width:  s.size,
              height: s.size,
              borderRadius: '50%',
              background: 'white',
              ['--s-op' as string]: s.opacity,
              animation: `starFlicker ${s.dur}s ${s.delay}s ease-in-out infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Page content (above background) ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ width: '100%', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Custom dark header — breadcrumb ── */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/me" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: D.muted }}>Profile</span>
        </Link>
        <svg width="10" height="10" viewBox="0 0 256 256" fill={D.faint}>
          <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'rgba(245,242,238,0.75)' }}>Sleep log</span>
      </div>

      <div style={{ padding: '8px 24px 0', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text, marginBottom: 4 }}>
          Sleep schedule
        </h1>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: D.muted }}>
          {isUpdate ? 'Logged — drag to adjust' : 'Drag the handles to set your times'}
        </p>
      </div>

      {/* ── Circular clock picker ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
        <svg
          ref={svgRef}
          width={SZ} height={SZ}
          viewBox={`0 0 ${SZ} ${SZ}`}
          style={{ overflow: 'visible', touchAction: 'none', userSelect: 'none' }}
        >
          {/* Gray track */}
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />

          {/* Sleep arc */}
          <defs>
            <linearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#8FAAE0"/>
              <stop offset="100%" stopColor="#B8AECC"/>
            </linearGradient>
          </defs>
          <path d={arcD(bedAngle, wakeAngle, R)} fill="none" stroke="url(#sleepGrad)" strokeWidth={14} strokeLinecap="round" />

          {/* Minor ticks */}
          {MINOR_HOURS.map(h => {
            const a = h2a(h)
            const [ix, iy] = polar(a, R - 9)
            const [ox, oy] = polar(a, R + 9)
            return <line key={h} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeLinecap="round"/>
          })}

          {/* Major labels */}
          {MAJOR.map(({ hour, label }) => {
            const a = h2a(hour)
            const [lx, ly] = polar(a, R - 36)
            return (
              <text key={hour} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, fill: 'rgba(245,242,238,0.35)' }}>
                {label}
              </text>
            )
          })}

          {/* Duration in center */}
          <text x={C} y={C - 10} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '28px', fontWeight: 800, fill: D.text }}>
            {durStr(bedtime, wakeTime)}
          </text>
          <text x={C} y={C + 18} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, fill: D.muted }}>
            of sleep
          </text>

          {/* Bedtime handle */}
          <circle cx={bedHx} cy={bedHy} r={HR} fill="#3A3560" stroke="rgba(143,170,224,0.6)" strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); draggingRef.current = 'bed' }}
          />
          <foreignObject x={bedHx - 7} y={bedHy - 7} width={14} height={14} style={{ pointerEvents: 'none' }}>
            <Moon size={14} />
          </foreignObject>

          {/* Wake handle */}
          <circle cx={wakeHx} cy={wakeHy} r={HR} fill="#5C4A20" stroke="rgba(245,201,138,0.7)" strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); draggingRef.current = 'wake' }}
          />
          <foreignObject x={wakeHx - 7} y={wakeHy - 7} width={14} height={14} style={{ pointerEvents: 'none' }}>
            <Sun size={14} />
          </foreignObject>
        </svg>
      </div>

      {/* ── Time display ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '4px 24px 28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Moon size={12} />
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: D.muted, letterSpacing: '0.06em' }}>BEDTIME</span>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text }}>{fmt(bedtime)}</p>
        </div>
        <div style={{ width: 1, background: D.bdr, alignSelf: 'stretch' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Sun size={12} />
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: D.muted, letterSpacing: '0.06em' }}>WAKE UP</span>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text }}>{fmt(wakeTime)}</p>
        </div>
      </div>

      {/* ── Quality ── */}
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: D.muted, marginBottom: 10, paddingLeft: 2 }}>
          HOW WAS LAST NIGHT?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUALITY.map(q => {
            const active = quality === q.value
            return (
              <button key={q.value} onClick={() => setQuality(q.value)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 14,
                border: `1.5px solid ${active ? 'rgba(143,170,224,0.45)' : D.bdr}`,
                background: active ? 'rgba(143,170,224,0.10)' : D.card,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700, color: active ? D.indigo : D.text, marginBottom: 1 }}>
                    {q.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: D.muted }}>
                    {q.desc}
                  </p>
                </div>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="9" cy="9" r="9" fill="rgba(143,170,224,0.30)"/>
                    <path d="M5.5 9L8 11.5L12.5 6.5" stroke={D.indigo} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Apple Health — iOS app only, hidden on web ── */}
      {/* TODO(ios): restore this section in the native app — identical UI, but wired to HealthKit */}

      {/* ── Save ── */}
      <div style={{ padding: '0 20px', marginBottom: 32 }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: saved ? 'rgba(94,194,105,0.20)' : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', fontWeight: 800,
            color: saved ? D.green : '#1E1C2E',
            transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? '✓ Logged!' : saving ? 'Saving…' : isUpdate ? 'Update sleep log' : 'Log sleep'}
        </button>
        <p style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: D.faint }}>
          Lumi uses sleep patterns to support your energy and mood.
        </p>
      </div>

      {/* ── History chart ── */}
      {loaded && (
        <SleepHistoryChart history={history} today={todayLog} />
      )}

      </div>{/* end max-width center */}
      </div>{/* end content wrapper */}
    </div>
  )
}
