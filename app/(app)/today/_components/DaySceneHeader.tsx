'use client'

import { useEffect, useState } from 'react'
import ProfileButton from '../../_components/ProfileButton'

interface Props { firstName: string }

type Scene = 'morning' | 'afternoon' | 'evening' | 'night'

function getScene(hour: number): Scene {
  if (hour >= 5  && hour < 11) return 'morning'
  if (hour >= 11 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 21) return 'evening'
  return 'night'
}

function getGreeting(hour: number) {
  if (hour >= 5  && hour < 11) return { text: 'Morning',   emoji: '🌅' }
  if (hour >= 11 && hour < 18) return { text: 'Afternoon', emoji: '☀️' }
  if (hour >= 18 && hour < 21) return { text: 'Evening',   emoji: '🌆' }
  return                               { text: 'Night',     emoji: '🌙' }
}

// ── Sky gradients ─────────────────────────────────────────────
// Stops tuned for 138px rendered height (76% of 180px viewBox).
// Bottom-most visible stop should land near the horizon warmth.
const SKY_STOPS: Record<Scene, { color: string; offset: string }[]> = {
  morning: [
    { color: '#0D1E38', offset: '0%'  },
    { color: '#1C3A6E', offset: '25%' },
    { color: '#6B3525', offset: '50%' },
    { color: '#C85A20', offset: '66%' },
    { color: '#F08A3A', offset: '78%' },
    { color: '#FFBB4A', offset: '100%'},
  ],
  afternoon: [
    { color: '#1473C8', offset: '0%'  },
    { color: '#3D9BE0', offset: '40%' },
    { color: '#86C8F0', offset: '68%' },
    { color: '#C2E8FA', offset: '78%' },
    { color: '#DAF0FC', offset: '100%'},
  ],
  evening: [
    { color: '#0C0D28', offset: '0%'  },
    { color: '#3A1A5E', offset: '25%' },
    { color: '#9C3020', offset: '50%' },
    { color: '#E05818', offset: '66%' },
    { color: '#F59030', offset: '78%' },
    { color: '#FFAA40', offset: '100%'},
  ],
  night: [
    { color: '#01020A', offset: '0%'  },
    { color: '#050D20', offset: '35%' },
    { color: '#0B1535', offset: '68%' },
    { color: '#111840', offset: '100%'},
  ],
}

// ── Stars — pre-set y < 80, keep them in upper sky ────────────
const STARS = [
  { x: 22,  y: 14, r: 1.0, o: 0.75, d: 2.3 }, { x: 52,  y: 8,  r: 1.2, o: 0.85, d: 3.1 },
  { x: 90,  y: 18, r: 0.9, o: 0.65, d: 2.7 }, { x: 128, y: 7,  r: 1.1, o: 0.80, d: 1.9 },
  { x: 165, y: 20, r: 0.8, o: 0.60, d: 3.4 }, { x: 35,  y: 38, r: 1.0, o: 0.70, d: 2.5 },
  { x: 74,  y: 44, r: 1.3, o: 0.90, d: 1.7 }, { x: 110, y: 35, r: 0.8, o: 0.55, d: 3.8 },
  { x: 148, y: 46, r: 1.1, o: 0.78, d: 2.2 }, { x: 188, y: 14, r: 0.9, o: 0.68, d: 2.9 },
  { x: 205, y: 40, r: 0.7, o: 0.50, d: 4.1 }, { x: 268, y: 50, r: 1.0, o: 0.72, d: 3.0 },
  { x: 285, y: 20, r: 0.8, o: 0.58, d: 2.4 }, { x: 14,  y: 60, r: 0.7, o: 0.45, d: 3.6 },
  { x: 56,  y: 68, r: 0.9, o: 0.62, d: 2.8 }, { x: 96,  y: 72, r: 0.7, o: 0.48, d: 3.3 },
  { x: 142, y: 64, r: 1.0, o: 0.70, d: 2.1 }, { x: 175, y: 58, r: 0.8, o: 0.55, d: 4.0 },
  { x: 220, y: 66, r: 0.7, o: 0.48, d: 2.6 }, { x: 255, y: 72, r: 0.9, o: 0.60, d: 3.2 },
  { x: 290, y: 60, r: 0.7, o: 0.45, d: 2.0 }, { x: 330, y: 42, r: 0.8, o: 0.55, d: 3.5 },
  { x: 355, y: 22, r: 1.1, o: 0.75, d: 1.6 }, { x: 368, y: 60, r: 0.9, o: 0.60, d: 3.7 },
]

// ── Clouds per scene ──────────────────────────────────────────
const CLOUDS: Record<Scene, { x: number; y: number; s: number; o: number }[]> = {
  morning:   [{ x: 68,  y: 72, s: 1.0,  o: 0.72 }, { x: 292, y: 80, s: 0.82, o: 0.58 }],
  afternoon: [{ x: 65,  y: 55, s: 1.1,  o: 0.92 }, { x: 258, y: 44, s: 0.88, o: 0.82 }, { x: 155, y: 30, s: 0.65, o: 0.70 }],
  evening:   [{ x: 72,  y: 78, s: 0.95, o: 0.65 }, { x: 295, y: 66, s: 0.78, o: 0.52 }],
  night:     [{ x: 105, y: 92, s: 0.82, o: 0.30 }, { x: 288, y: 96, s: 0.65, o: 0.22 }],
}

const CLOUD_COLOR: Record<Scene, string> = {
  morning:   '#FFCCA0',
  afternoon: '#FFFFFF',
  evening:   '#FF9050',
  night:     '#1A2850',
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

  const isNightish = scene === 'evening' || scene === 'night'

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>

      {/* ── Sky scene ── */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 390 180"
          preserveAspectRatio="xMidYMin slice"
          style={{ display: 'block', width: '100%', height: '138px' }}
        >
          <defs>
            {/* Sky gradient */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              {scene
                ? SKY_STOPS[scene].map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)
                : <stop offset="0%" stopColor="#01020A" />}
            </linearGradient>

            {/* Warm horizon glow — morning + evening */}
            {scene === 'morning' && (<>
              <radialGradient id="horizonGlow" cx="50%" cy="100%" r="72%">
                <stop offset="0%"   stopColor="#FFBA4D" stopOpacity="0.70"/>
                <stop offset="32%"  stopColor="#F07030" stopOpacity="0.35"/>
                <stop offset="100%" stopColor="#C84010" stopOpacity="0"/>
              </radialGradient>
              {/* Soft sun orb — low on horizon, slightly off-centre */}
              <radialGradient id="sunOrb" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFF4B0" stopOpacity="0.95"/>
                <stop offset="18%"  stopColor="#FFD84A" stopOpacity="0.70"/>
                <stop offset="45%"  stopColor="#FF8C20" stopOpacity="0.32"/>
                <stop offset="100%" stopColor="#FF5500" stopOpacity="0"/>
              </radialGradient>
            </>)}
            {scene === 'evening' && (
              <radialGradient id="horizonGlow" cx="50%" cy="100%" r="68%">
                <stop offset="0%"   stopColor="#FFAA30" stopOpacity="0.65"/>
                <stop offset="35%"  stopColor="#E05020" stopOpacity="0.30"/>
                <stop offset="100%" stopColor="#E05020" stopOpacity="0"/>
              </radialGradient>
            )}

            {/* Moon glow (night only) */}
            {scene === 'night' && (
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFF8DC" stopOpacity="0.28"/>
                <stop offset="100%" stopColor="#FFF8DC" stopOpacity="0"/>
              </radialGradient>
            )}

            {/* Cloud softening blur */}
            <filter id="cloudBlur" x="-40%" y="-80%" width="180%" height="260%">
              <feGaussianBlur stdDeviation="0.7"/>
            </filter>

            {/* Evening crescent mask */}
            {scene === 'evening' && (
              <mask id="moonMask">
                <circle cx="72" cy="36" r="10" fill="white"/>
                <circle cx="79" cy="32" r="8"  fill="black"/>
              </mask>
            )}
            {/* Night crescent mask */}
            {scene === 'night' && (
              <mask id="moonMask">
                <circle cx="72" cy="36" r="13" fill="white"/>
                <circle cx="77" cy="32" r="10" fill="black"/>
              </mask>
            )}
          </defs>

          {/* Sky fill */}
          <rect width="390" height="180" fill="url(#skyGrad)"/>

          {/* Horizon glow */}
          {(scene === 'morning' || scene === 'evening') && (
            <ellipse cx="195" cy="145" rx="240" ry="105" fill="url(#horizonGlow)"/>
          )}

          {/* Morning sun orb — soft radial bloom, raised to sit visibly in the sky */}
          {scene === 'morning' && (
            <circle cx="210" cy="100" r="90" fill="url(#sunOrb)"/>
          )}

          {/* Stars — evening (dim) + night (bright), all twinkling */}
          {isNightish && STARS.map((s, i) => {
            const baseO = scene === 'evening' ? +(s.o * 0.48).toFixed(2) : s.o
            return (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={baseO}>
                <animate
                  attributeName="fill-opacity"
                  values={`${baseO};${+(baseO * 0.18).toFixed(2)};${baseO}`}
                  dur={`${s.d}s`}
                  repeatCount="indefinite"
                  begin={`-${((i * 0.61) % s.d).toFixed(2)}s`}
                />
              </circle>
            )
          })}

          {/* Moon — evening: dim crescent, night: fuller with glow */}
          {(scene === 'evening' || scene === 'night') && <>
            {scene === 'night' && <circle cx="72" cy="36" r="34" fill="url(#moonGlow)"/>}
            <circle
              cx="72" cy="36"
              r={scene === 'night' ? 13 : 10}
              fill={scene === 'night' ? '#FFF6DC' : '#EEE4C0'}
              fillOpacity={scene === 'night' ? 0.90 : 0.62}
              mask="url(#moonMask)"
            />
          </>}

          {/* Blurred atmospheric clouds */}
          {scene && CLOUDS[scene].map((c, i) => (
            <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`} filter="url(#cloudBlur)" opacity={c.o}>
              <ellipse cx={0}   cy={0}   rx={52} ry={17} fill={CLOUD_COLOR[scene]}/>
              <ellipse cx={-22} cy={-11} rx={33} ry={16} fill={CLOUD_COLOR[scene]}/>
              <ellipse cx={20}  cy={-14} rx={38} ry={17} fill={CLOUD_COLOR[scene]}/>
              <ellipse cx={46}  cy={-5}  rx={25} ry={14} fill={CLOUD_COLOR[scene]}/>
            </g>
          ))}
        </svg>

        {/* Profile button */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <ProfileButton />
        </div>
      </div>

      {/* ── Beige dome — curved shape divider ── */}
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
