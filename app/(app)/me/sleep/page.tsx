'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

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

// ─── Clock math ───────────────────────────────────────────────────────────────
const SZ = 280        // SVG viewport
const C  = SZ / 2     // center
const R  = 108        // arc track radius
const HR = 18         // handle radius

function h2a(h: number)  { return (h / 24) * 360 }
function a2h(a: number)  {
  const raw = ((a / 360) * 24 + 24) % 24
  return Math.round(raw * 2) / 2   // snap to 30-min increments
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

// ─── Clock labels (inside ring) ───────────────────────────────────────────────
const MAJOR = [
  { hour: 0,  label: '12am' },
  { hour: 6,  label: '6am'  },
  { hour: 12, label: '12pm' },
  { hour: 18, label: '6pm'  },
]
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

// ─── Quality options ──────────────────────────────────────────────────────────
const QUALITY = [
  { value: 'great', label: 'Rested',       desc: 'Woke up feeling good' },
  { value: 'okay',  label: 'Got through it', desc: 'Managed but tired' },
  { value: 'rough', label: 'Rough night',  desc: 'Running on fumes'    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SleepPage() {
  const [bedtime,  setBedtime]  = useState(22)    // 10:00 pm
  const [wakeTime, setWakeTime] = useState(6.5)   // 6:30 am
  const [quality,  setQuality]  = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  const svgRef      = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<'bed' | 'wake' | null>(null)

  // Global drag tracking via refs (avoids stale closure issues)
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
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtime, wake_time: wakeTime, quality }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const bedAngle  = h2a(bedtime)
  const wakeAngle = h2a(wakeTime)
  const [bx, by]  = polar(bedAngle,  HR + 4)   // not used directly
  const [wx, wy]  = polar(wakeAngle, HR + 4)   // not used directly
  const [bedHx, bedHy]   = polar(bedAngle,  R)
  const [wakeHx, wakeHy] = polar(wakeAngle, R)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: D.bg, paddingBottom: 48 }}>

      {/* ── Custom dark header ── */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/me" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke={D.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: D.muted }}>
            Back
          </span>
        </Link>
      </div>

      <div style={{ padding: '8px 24px 0', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text, marginBottom: 4 }}>
          Sleep schedule
        </h1>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500, color: D.muted }}>
          Drag the handles to set your times
        </p>
      </div>

      {/* ── Circular clock picker ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
        <svg
          ref={svgRef}
          width={SZ}
          height={SZ}
          viewBox={`0 0 ${SZ} ${SZ}`}
          style={{ overflow: 'visible', touchAction: 'none', userSelect: 'none' }}
        >
          {/* Gray track */}
          <circle
            cx={C} cy={C} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
          />

          {/* Sleep arc — indigo/violet gradient */}
          <defs>
            <linearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#8FAAE0"/>
              <stop offset="100%" stopColor="#B8AECC"/>
            </linearGradient>
          </defs>
          <path
            d={arcD(bedAngle, wakeAngle, R)}
            fill="none"
            stroke="url(#sleepGrad)"
            strokeWidth={14}
            strokeLinecap="round"
          />

          {/* Minor tick marks at quarter hours */}
          {MINOR_HOURS.map(h => {
            const a = h2a(h)
            const [ix, iy] = polar(a, R - 9)
            const [ox, oy] = polar(a, R + 9)
            return (
              <line key={h} x1={ix} y1={iy} x2={ox} y2={oy}
                stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeLinecap="round"/>
            )
          })}

          {/* Major clock labels inside ring */}
          {MAJOR.map(({ hour, label }) => {
            const a = h2a(hour)
            const [lx, ly] = polar(a, R - 36)
            return (
              <text
                key={hour}
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  fill: 'rgba(245,242,238,0.35)',
                }}
              >
                {label}
              </text>
            )
          })}

          {/* Duration in center */}
          <text
            x={C} y={C - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '28px', fontWeight: 800, fill: D.text }}
          >
            {durStr(bedtime, wakeTime)}
          </text>
          <text
            x={C} y={C + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, fill: D.muted }}
          >
            of sleep
          </text>

          {/* Bedtime handle — moon */}
          <circle
            cx={bedHx} cy={bedHy} r={HR}
            fill="#3A3560"
            stroke="rgba(143,170,224,0.6)"
            strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); draggingRef.current = 'bed' }}
          />
          <foreignObject x={bedHx - 7} y={bedHy - 7} width={14} height={14} style={{ pointerEvents: 'none' }}>
            <Moon size={14} />
          </foreignObject>

          {/* Wake time handle — sun */}
          <circle
            cx={wakeHx} cy={wakeHy} r={HR}
            fill="#5C4A20"
            stroke="rgba(245,201,138,0.7)"
            strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); draggingRef.current = 'wake' }}
          />
          <foreignObject x={wakeHx - 7} y={wakeHy - 7} width={14} height={14} style={{ pointerEvents: 'none' }}>
            <Sun size={14} />
          </foreignObject>
        </svg>
      </div>

      {/* ── Time display ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 48,
        padding: '4px 24px 28px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Moon size={12} />
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: D.muted, letterSpacing: '0.06em' }}>
              BEDTIME
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text }}>
            {fmt(bedtime)}
          </p>
        </div>

        <div style={{ width: 1, background: D.bdr, alignSelf: 'stretch' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Sun size={12} />
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 700, color: D.muted, letterSpacing: '0.06em' }}>
              WAKE UP
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '22px', fontWeight: 800, color: D.text }}>
            {fmt(wakeTime)}
          </p>
        </div>
      </div>

      {/* ── Quality ── */}
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '10px',
          fontWeight: 800, letterSpacing: '0.1em', color: D.muted,
          marginBottom: 10, paddingLeft: 2,
        }}>
          HOW WAS LAST NIGHT?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUALITY.map(q => {
            const active = quality === q.value
            return (
              <button
                key={q.value}
                onClick={() => setQuality(q.value)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 14,
                  border: `1.5px solid ${active ? 'rgba(143,170,224,0.45)' : D.bdr}`,
                  background: active ? 'rgba(143,170,224,0.10)' : D.card,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '14px',
                    fontWeight: 700, color: active ? D.indigo : D.text, marginBottom: 1,
                  }}>
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

      {/* ── Apple Health (future) ── */}
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '10px',
          fontWeight: 800, letterSpacing: '0.1em', color: D.muted,
          marginBottom: 10, paddingLeft: 2,
        }}>
          APPLE HEALTH
        </p>
        <div style={{
          borderRadius: 14, border: `1.5px solid ${D.bdr}`,
          background: D.card, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          opacity: 0.55,
        }}>
          {/* Apple Health heart icon */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,59,48,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 256 256" fill="#FF3B30">
              <path d="M240,94c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,220.66,16,164,16,94A62.07,62.07,0,0,1,78,32c20.65,0,38.73,8.88,50,23.89C139.27,40.88,157.35,32,178,32A62.07,62.07,0,0,1,240,94Z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700, color: D.text, marginBottom: 2 }}>
              Connect Apple Health
            </p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: D.muted }}>
              Read &amp; write sleep data — coming in the iOS app
            </p>
          </div>
          <div style={{
            width: 42, height: 26, borderRadius: 13,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center',
            padding: '3px',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: saved
              ? 'rgba(94,194,105,0.20)'
              : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px', fontWeight: 800,
            color: saved ? D.green : '#1E1C2E',
            transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? '✓ Logged!' : saving ? 'Saving…' : 'Log sleep'}
        </button>
        <p style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
          fontWeight: 500, color: D.faint,
        }}>
          Lumi uses sleep patterns to support your energy and mood.
        </p>
      </div>

    </div>
  )
}
