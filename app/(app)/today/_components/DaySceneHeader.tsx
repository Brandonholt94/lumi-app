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
  return                               { text: 'Night',     emoji: '🌙' }
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

// ── Stars — pre-set, y < 80 to stay above dome crest ──────────
const STARS = [
  { x: 22,  y: 14, r: 1.1, o: 0.80, d: 2.1 }, { x: 68,  y: 9,  r: 0.8, o: 0.60, d: 3.4 },
  { x: 118, y: 24, r: 1.3, o: 0.85, d: 1.8 }, { x: 172, y: 7,  r: 0.9, o: 0.65, d: 2.7 },
  { x: 238, y: 19, r: 1.2, o: 0.80, d: 3.1 }, { x: 300, y: 12, r: 0.8, o: 0.55, d: 2.4 },
  { x: 355, y: 22, r: 1.1, o: 0.75, d: 1.6 }, { x: 42,  y: 44, r: 0.9, o: 0.60, d: 3.8 },
  { x: 98,  y: 52, r: 1.2, o: 0.70, d: 2.2 }, { x: 158, y: 38, r: 0.8, o: 0.55, d: 3.0 },
  { x: 215, y: 48, r: 1.1, o: 0.75, d: 1.4 }, { x: 272, y: 34, r: 0.9, o: 0.65, d: 2.9 },
  { x: 332, y: 42, r: 1.0, o: 0.70, d: 3.5 }, { x: 14,  y: 70, r: 0.8, o: 0.50, d: 2.0 },
  { x: 148, y: 74, r: 0.9, o: 0.55, d: 3.3 }, { x: 228, y: 66, r: 1.1, o: 0.65, d: 1.9 },
  { x: 295, y: 72, r: 0.8, o: 0.50, d: 2.6 }, { x: 368, y: 60, r: 1.0, o: 0.60, d: 3.7 },
  { x: 55,  y: 28, r: 0.7, o: 0.45, d: 4.1 }, { x: 185, y: 58, r: 0.7, o: 0.45, d: 2.3 },
  { x: 318, y: 56, r: 0.7, o: 0.50, d: 3.9 }, { x: 82,  y: 62, r: 0.7, o: 0.45, d: 1.7 },
  // Additional stars
  { x: 130, y: 11, r: 0.9, o: 0.70, d: 2.8 }, { x: 200, y: 30, r: 0.7, o: 0.50, d: 4.2 },
  { x: 258, y: 52, r: 1.0, o: 0.65, d: 1.5 }, { x: 346, y: 38, r: 0.8, o: 0.55, d: 3.2 },
  { x: 8,   y: 42, r: 0.9, o: 0.60, d: 2.5 }, { x: 380, y: 28, r: 0.7, o: 0.50, d: 3.6 },
  { x: 72,  y: 75, r: 0.8, o: 0.45, d: 4.0 }, { x: 310, y: 74, r: 0.7, o: 0.48, d: 1.3 },
  { x: 178, y: 18, r: 0.6, o: 0.42, d: 2.1 }, { x: 340, y: 18, r: 0.6, o: 0.40, d: 3.8 },
  { x: 28,  y: 58, r: 0.6, o: 0.38, d: 4.3 }, { x: 248, y: 76, r: 0.6, o: 0.40, d: 2.0 },
  { x: 134, y: 60, r: 0.6, o: 0.38, d: 3.1 }, { x: 372, y: 75, r: 0.6, o: 0.42, d: 1.8 },
]

// ── Clouds per scene: x, y, scale (s), opacity (o) ───────────
const CLOUDS: Record<Scene, { x: number; y: number; s: number; o: number }[]> = {
  morning:   [{ x: 58, y: 116, s: 1.0, o: 0.18 }, { x: 298, y: 126, s: 0.82, o: 0.14 }],
  afternoon: [{ x: 58, y: 102, s: 1.1, o: 0.30 }, { x: 255, y: 114, s: 0.88, o: 0.25 }, { x: 336, y: 97, s: 0.72, o: 0.22 }],
  evening:   [{ x: 76, y: 112, s: 0.95, o: 0.22 }, { x: 300, y: 122, s: 0.78, o: 0.18 }],
  night:     [{ x: 194, y: 118, s: 0.82, o: 0.13 }, { x: 326, y: 116, s: 0.65, o: 0.11 }],
}

const CLOUD_FILL: Record<Scene, string> = {
  morning:   '#FFE4D0',
  afternoon: '#FFFFFF',
  evening:   '#C4A8D8',
  night:     '#9490B8',
}

function Cloud({ x, y, s, o, fill }: { x: number; y: number; s: number; o: number; fill: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <ellipse cx={0}   cy={0}   rx={34} ry={13} fill={fill} />
      <ellipse cx={-17} cy={-9}  rx={21} ry={13} fill={fill} />
      <ellipse cx={13}  cy={-12} rx={25} ry={14} fill={fill} />
      <ellipse cx={32}  cy={-4}  rx={17} ry={11} fill={fill} />
    </g>
  )
}

// ── Sun rays ──────────────────────────────────────────────────
const MORNING_RAYS = [
  { a: -75, len: 36, w: 1.2, o: 0.12 }, { a: -58, len: 55, w: 1.5, o: 0.18 },
  { a: -42, len: 50, w: 1.5, o: 0.16 }, { a: -27, len: 68, w: 2.0, o: 0.22 },
  { a: -13, len: 74, w: 2.0, o: 0.27 }, { a:   0, len: 78, w: 2.5, o: 0.30 },
  { a:  13, len: 74, w: 2.0, o: 0.27 }, { a:  27, len: 68, w: 2.0, o: 0.22 },
  { a:  42, len: 50, w: 1.5, o: 0.16 }, { a:  58, len: 55, w: 1.5, o: 0.18 },
  { a:  75, len: 36, w: 1.2, o: 0.12 },
]

const AFTERNOON_RAYS = [
  { a: -80, len: 38, w: 1.2, o: 0.18 }, { a: -55, len: 52, w: 1.5, o: 0.24 },
  { a: -30, len: 58, w: 1.8, o: 0.28 }, { a:  -8, len: 62, w: 2.0, o: 0.32 },
  { a:  15, len: 62, w: 2.0, o: 0.32 }, { a:  38, len: 58, w: 1.8, o: 0.28 },
  { a:  62, len: 52, w: 1.5, o: 0.24 }, { a:  85, len: 38, w: 1.2, o: 0.18 },
  { a: -110, len: 30, w: 1.0, o: 0.12 }, { a: 110, len: 30, w: 1.0, o: 0.12 },
]

function ray(ox: number, oy: number, angleDeg: number, len: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x2: ox + Math.sin(rad) * len, y2: oy - Math.cos(rad) * len }
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

  const CREST = { x: 195, y: 95 }
  const SUN   = { x: 195, y: 30 }
  // Moon: upper-left, clear of profile button (upper-right)
  const MOON  = { x: 70, y: 40 }

  const isNightish = scene === 'evening' || scene === 'night'

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>

      {/* ── Scene ── */}
      <div style={{ position: 'relative' }}>
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

            {/* Moon glow */}
            {isNightish && (
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFF8DC" stopOpacity={scene === 'night' ? '0.35' : '0.22'} />
                <stop offset="100%" stopColor="#FFF8DC" stopOpacity="0" />
              </radialGradient>
            )}

            {/* Crescent moon mask (evening) */}
            {scene === 'evening' && (
              <mask id="crescentMask">
                <circle cx={MOON.x}     cy={MOON.y}     r={10} fill="white" />
                <circle cx={MOON.x + 7} cy={MOON.y - 5} r={8}  fill="black" />
              </mask>
            )}

            {/* Near-full moon mask (night) */}
            {scene === 'night' && (
              <mask id="fullMoonMask">
                <circle cx={MOON.x}     cy={MOON.y}     r={13} fill="white" />
                <circle cx={MOON.x + 4} cy={MOON.y - 3} r={10} fill="black" />
              </mask>
            )}
          </defs>

          {/* Sky */}
          <rect width="390" height="180" fill="url(#skyGrad)" />

          {/* ── Stars: evening + night — with twinkle ── */}
          {isNightish && STARS.map((s, i) => {
            const baseO = scene === 'evening' ? s.o * 0.55 : s.o
            return (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={baseO}>
                <animate
                  attributeName="fill-opacity"
                  values={`${baseO};${+(baseO * 0.22).toFixed(2)};${baseO}`}
                  dur={`${s.d}s`}
                  repeatCount="indefinite"
                  begin={`-${((i * 0.61) % s.d).toFixed(2)}s`}
                />
              </circle>
            )
          })}

          {/* ── Moon: evening = crescent, night = near-full ── */}
          {scene === 'evening' && <>
            <circle cx={MOON.x} cy={MOON.y} r={26} fill="url(#moonGlow)" />
            <circle cx={MOON.x} cy={MOON.y} r={10} fill="#EEE4C0" fillOpacity={0.72} mask="url(#crescentMask)" />
          </>}

          {scene === 'night' && <>
            <circle cx={MOON.x} cy={MOON.y} r={34} fill="url(#moonGlow)" />
            <circle cx={MOON.x} cy={MOON.y} r={13} fill="#FFF6DC" fillOpacity={0.92} mask="url(#fullMoonMask)" />
            {/* Subtle surface texture dots */}
            <circle cx={MOON.x - 3} cy={MOON.y + 3} r={1.8} fill="#E8D8A0" fillOpacity={0.20} />
            <circle cx={MOON.x + 4} cy={MOON.y - 2} r={1.2} fill="#E8D8A0" fillOpacity={0.15} />
          </>}

          {/* ── Morning: horizon glow + rising sun rays ── */}
          {scene === 'morning' && <>
            <ellipse cx={CREST.x} cy={CREST.y + 10} rx={160} ry={80} fill="url(#horizonGlow)" />
            {MORNING_RAYS.map((r, i) => {
              const end = ray(CREST.x, CREST.y, r.a, r.len)
              return (
                <line key={i} x1={CREST.x} y1={CREST.y} x2={end.x2} y2={end.y2}
                  stroke="#F5C98A" strokeWidth={r.w} strokeOpacity={r.o} strokeLinecap="round" />
              )
            })}
          </>}

          {/* ── Afternoon: sun disc + rays ── */}
          {scene === 'afternoon' && <>
            <circle cx={SUN.x} cy={SUN.y} r={52} fill="url(#sunGlow)" />
            {AFTERNOON_RAYS.map((r, i) => {
              const end = ray(SUN.x, SUN.y, r.a, r.len)
              return (
                <line key={i} x1={SUN.x} y1={SUN.y} x2={end.x2} y2={end.y2}
                  stroke="#FFE896" strokeWidth={r.w} strokeOpacity={r.o} strokeLinecap="round" />
              )
            })}
            <circle cx={SUN.x} cy={SUN.y} r={14} fill="#FFE896" fillOpacity={0.9} />
            <circle cx={SUN.x} cy={SUN.y} r={9}  fill="#FFFBD0" />
          </>}

          {/* ── Clouds ── */}
          {scene && CLOUDS[scene].map((c, i) => (
            <Cloud key={i} x={c.x} y={c.y} s={c.s} o={c.o} fill={CLOUD_FILL[scene]} />
          ))}
        </svg>

        {/* Profile button floats top-right in the sky */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <ProfileButton />
        </div>
      </div>

      {/* ── Greeting — domes up into the sky as a hill shape ── */}
      <div style={{
        background: '#FBF8F5',
        borderRadius: '50% 50% 0 0 / 28px 28px 0 0',
        marginTop: -28,
        paddingTop: 46,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'relative',
        zIndex: 2,
      }}>
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
