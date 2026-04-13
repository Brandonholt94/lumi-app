'use client'

import { useEffect, useState } from 'react'
import ProfileButton from '../../_components/ProfileButton'

interface Props { firstName: string }

type Scene = 'morning' | 'afternoon' | 'evening' | 'night'

function getScene(hour: number): Scene {
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function getGreeting(hour: number) {
  if (hour >= 5  && hour < 12) return { text: 'Morning',   emoji: '🌅' }
  if (hour >= 12 && hour < 17) return { text: 'Afternoon', emoji: '☀️' }
  if (hour >= 17 && hour < 21) return { text: 'Evening',   emoji: '🌆' }
  return                               { text: 'Evening',   emoji: '🌙' }
}

// ── Sky gradients ──────────────────────────────────────────────
const SKY: Record<Scene, string[]> = {
  morning:   ['#1E1C2E', '#4A2260', '#E8A0BF', '#F4A582', '#F5C98A'],
  afternoon: ['#4A7AB8', '#8FAAE0', '#C0D8F0'],
  evening:   ['#1A1228', '#5E2D5E', '#E8A0BF', '#F4A582'],
  night:     ['#09071A', '#1E1C2E', '#2D2A3E', '#3A3660'],
}
const SKY_STOPS: Record<Scene, string[]> = {
  morning:   ['0%', '20%', '50%', '75%', '100%'],
  afternoon: ['0%', '55%', '100%'],
  evening:   ['0%', '22%', '60%', '100%'],
  night:     ['0%', '38%', '74%', '100%'],
}

// ── Hill tint ──────────────────────────────────────────────────
const HILL: Record<Scene, string> = {
  morning:   '#15101F',
  afternoon: '#121B2E',
  evening:   '#110D1E',
  night:     '#08061A',
}

// ── Stars — pre-set so they never shift on re-render ──────────
// Kept in the upper sky area (y < 80) so they clear the dome crest
const STARS = [
  { x: 22,  y: 14, r: 1.1, o: 0.80 }, { x: 68,  y: 9,  r: 0.8, o: 0.60 },
  { x: 118, y: 24, r: 1.3, o: 0.85 }, { x: 172, y: 7,  r: 0.9, o: 0.65 },
  { x: 238, y: 19, r: 1.2, o: 0.80 }, { x: 300, y: 12, r: 0.8, o: 0.55 },
  { x: 355, y: 22, r: 1.1, o: 0.75 }, { x: 42,  y: 44, r: 0.9, o: 0.60 },
  { x: 98,  y: 52, r: 1.2, o: 0.70 }, { x: 158, y: 38, r: 0.8, o: 0.55 },
  { x: 215, y: 48, r: 1.1, o: 0.75 }, { x: 272, y: 34, r: 0.9, o: 0.65 },
  { x: 332, y: 42, r: 1.0, o: 0.70 }, { x: 14,  y: 70, r: 0.8, o: 0.50 },
  { x: 148, y: 74, r: 0.9, o: 0.55 }, { x: 228, y: 66, r: 1.1, o: 0.65 },
  { x: 295, y: 72, r: 0.8, o: 0.50 }, { x: 368, y: 60, r: 1.0, o: 0.60 },
  { x: 55,  y: 28, r: 0.7, o: 0.45 }, { x: 185, y: 58, r: 0.7, o: 0.45 },
  { x: 318, y: 56, r: 0.7, o: 0.50 }, { x: 82,  y: 62, r: 0.7, o: 0.45 },
]

// ── Morning sun rays — emanate from dome crest (195, 95) upward ─
// angle: degrees from vertical (0 = straight up). len: ray length.
const MORNING_RAYS = [
  { a: -75, len: 36, w: 1.2, o: 0.12 },
  { a: -58, len: 55, w: 1.5, o: 0.18 },
  { a: -42, len: 50, w: 1.5, o: 0.16 },
  { a: -27, len: 68, w: 2.0, o: 0.22 },
  { a: -13, len: 74, w: 2.0, o: 0.27 },
  { a:   0, len: 78, w: 2.5, o: 0.30 },
  { a:  13, len: 74, w: 2.0, o: 0.27 },
  { a:  27, len: 68, w: 2.0, o: 0.22 },
  { a:  42, len: 50, w: 1.5, o: 0.16 },
  { a:  58, len: 55, w: 1.5, o: 0.18 },
  { a:  75, len: 36, w: 1.2, o: 0.12 },
]

// ── Afternoon sun rays — from overhead (195, 30), all directions ─
const AFTERNOON_RAYS = [
  { a: -80, len: 38, w: 1.2, o: 0.18 },
  { a: -55, len: 52, w: 1.5, o: 0.24 },
  { a: -30, len: 58, w: 1.8, o: 0.28 },
  { a:  -8, len: 62, w: 2.0, o: 0.32 },
  { a:  15, len: 62, w: 2.0, o: 0.32 },
  { a:  38, len: 58, w: 1.8, o: 0.28 },
  { a:  62, len: 52, w: 1.5, o: 0.24 },
  { a:  85, len: 38, w: 1.2, o: 0.18 },
  // A couple going more sideways for overhead look
  { a: -110, len: 30, w: 1.0, o: 0.12 },
  { a:  110, len: 30, w: 1.0, o: 0.12 },
]

function ray(ox: number, oy: number, angleDeg: number, len: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x2: ox + Math.sin(rad) * len,
    y2: oy - Math.cos(rad) * len,
  }
}

export default function DaySceneHeader({ firstName }: Props) {
  const [scene,    setScene]    = useState<Scene | null>(null)
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null)
  const [date,     setDate]     = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setScene(getScene(hour))
    setGreeting(getGreeting(hour))
    setDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    }))
  }, [])

  const hillColor = scene ? HILL[scene] : '#08061A'
  // Dome extends far off both sides so only the smooth arc is visible
  const dome = 'M -300 260 C -300 40, 690 40, 690 260 Z'
  // Dome crest ≈ (195, 95) in 180px viewBox — rays start here
  const CREST = { x: 195, y: 95 }
  // Afternoon sun sits high in the sky
  const SUN   = { x: 195, y: 30 }

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>

      {/* ── Scene ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 390 180"
          width="100%"
          preserveAspectRatio="xMidYMid slice"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              {scene
                ? SKY[scene].map((c, i) => <stop key={i} offset={SKY_STOPS[scene][i]} stopColor={c} />)
                : <stop offset="0%" stopColor="#09071A" />}
            </linearGradient>

            {/* Morning horizon glow */}
            {scene === 'morning' && (
              <radialGradient id="horizonGlow" cx="50%" cy="100%" r="60%">
                <stop offset="0%"   stopColor="#F5C98A" stopOpacity="0.55" />
                <stop offset="55%"  stopColor="#F4A582" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#F4A582" stopOpacity="0"    />
              </radialGradient>
            )}

            {/* Afternoon sun glow */}
            {scene === 'afternoon' && (
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFF5CC" stopOpacity="0.90" />
                <stop offset="40%"  stopColor="#F5C98A" stopOpacity="0.40" />
                <stop offset="100%" stopColor="#F5C98A" stopOpacity="0"    />
              </radialGradient>
            )}
          </defs>

          {/* Sky */}
          <rect width="390" height="180" fill="url(#skyGrad)" />

          {/* ── Stars: evening + night ── */}
          {(scene === 'evening' || scene === 'night') && STARS.map((s, i) => (
            <circle
              key={i} cx={s.x} cy={s.y} r={s.r}
              fill="white"
              fillOpacity={scene === 'evening' ? s.o * 0.55 : s.o}
            />
          ))}

          {/* ── Morning: horizon glow + rising sun rays ── */}
          {scene === 'morning' && <>
            {/* Wide horizon glow emanating from crest */}
            <ellipse cx={CREST.x} cy={CREST.y + 10} rx={160} ry={80} fill="url(#horizonGlow)" />
            {/* Rays */}
            {MORNING_RAYS.map((r, i) => {
              const end = ray(CREST.x, CREST.y, r.a, r.len)
              return (
                <line
                  key={i}
                  x1={CREST.x} y1={CREST.y}
                  x2={end.x2}  y2={end.y2}
                  stroke="#F5C98A"
                  strokeWidth={r.w}
                  strokeOpacity={r.o}
                  strokeLinecap="round"
                />
              )
            })}
          </>}

          {/* ── Afternoon: sun disc + overhead rays ── */}
          {scene === 'afternoon' && <>
            {/* Soft glow around sun */}
            <circle cx={SUN.x} cy={SUN.y} r={52} fill="url(#sunGlow)" />
            {/* Rays */}
            {AFTERNOON_RAYS.map((r, i) => {
              const end = ray(SUN.x, SUN.y, r.a, r.len)
              return (
                <line
                  key={i}
                  x1={SUN.x} y1={SUN.y}
                  x2={end.x2} y2={end.y2}
                  stroke="#FFE896"
                  strokeWidth={r.w}
                  strokeOpacity={r.o}
                  strokeLinecap="round"
                />
              )
            })}
            {/* Sun disc */}
            <circle cx={SUN.x} cy={SUN.y} r={14} fill="#FFE896" fillOpacity={0.9} />
            <circle cx={SUN.x} cy={SUN.y} r={9}  fill="#FFFBD0" />
          </>}

          {/* ── Dome hill silhouette ── */}
          <path d={dome} fill={hillColor} />
        </svg>

        {/* Profile button floats top-right in the sky */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <ProfileButton />
        </div>
      </div>

      {/* ── Greeting — sits below the hill in the content area ── */}
      <div style={{ background: '#FBF8F5', padding: '18px 20px 0' }}>
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 26, fontWeight: 900,
          color: '#1E1C2E',
          lineHeight: 1.1, marginBottom: 3,
        }}>
          {greeting ? `${greeting.emoji} ${greeting.text}, ` : <span style={{ opacity: 0 }}>·</span>}
          {greeting && (
            <span style={{
              background: 'linear-gradient(90deg, #F4A582, #F5C98A, #8FAAE0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {firstName}.
            </span>
          )}
        </h1>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: 12, fontWeight: 600,
          color: '#9895B0',
        }}>
          {date || '\u00A0'} · Let&apos;s find your one thing.
        </p>
      </div>

    </div>
  )
}
