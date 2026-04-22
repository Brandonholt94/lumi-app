'use client'

import { useEffect, useState } from 'react'

interface Props { firstName: string }

type Scene = 'morning' | 'afternoon' | 'evening' | 'night'

function getScene(hour: number): Scene {
  if (hour >= 5  && hour < 11) return 'morning'
  if (hour >= 11 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 21) return 'evening'
  return 'night'
}

function getGreeting(hour: number) {
  if (hour >= 5  && hour < 11) return 'Morning'
  if (hour >= 11 && hour < 18) return 'Afternoon'
  if (hour >= 18 && hour < 21) return 'Evening'
  return 'Night'
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
    { color: '#3D9BE0', offset: '35%' },
    { color: '#7EC5F0', offset: '58%' },
    { color: '#C8E8F5', offset: '70%' },
    { color: '#EEF2D8', offset: '76%' },
    { color: '#F5F0C8', offset: '100%'},
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
// Afternoon clouds sit LOW (y≈100-108) so the beige dome clips their
// bottoms — they look like they're rising over the hill.
const CLOUDS: Record<Scene, { x: number; y: number; s: number; o: number }[]> = {
  morning:   [{ x: 30,  y: 80,  s: 0.90, o: 0.70 }, { x: 268, y: 86,  s: 0.75, o: 0.55 }],
  afternoon: [{ x: -8,  y: 100, s: 1.30, o: 0.96 }, { x: 312, y: 103, s: 1.10, o: 0.93 }, { x: 112, y: 62,  s: 0.70, o: 0.78 }],
  evening:   [{ x: 25,  y: 84,  s: 0.90, o: 0.62 }, { x: 268, y: 78,  s: 0.75, o: 0.50 }],
  night:     [{ x: 80,  y: 95,  s: 0.78, o: 0.28 }, { x: 268, y: 98,  s: 0.62, o: 0.20 }],
}

const CLOUD_COLOR: Record<Scene, string> = {
  morning:   '#FFCCA0',
  afternoon: '#DCF0FF', // cool blue-white so clouds read clearly against warm beige
  evening:   '#FF9050',
  night:     '#1A2850',
}

export default function DaySceneHeader({ firstName }: Props) {
  const [scene,    setScene]    = useState<Scene | null>(null)
  const [greeting, setGreeting] = useState<string | null>(null)
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

            {/* Afternoon sun glow */}
            {scene === 'afternoon' && (
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFFDE7" stopOpacity="1"/>
                <stop offset="30%"  stopColor="#FFE082" stopOpacity="0.55"/>
                <stop offset="100%" stopColor="#FFC107" stopOpacity="0"/>
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

          {/* Morning sun orb — soft radial bloom with gentle pulse */}
          {scene === 'morning' && (
            <circle cx="210" cy="100" r="90" fill="url(#sunOrb)">
              <animate
                attributeName="opacity"
                values="0.88;1;0.88"
                dur="7s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Afternoon sun — crisp disk + rays + soft glow, upper right */}
          {scene === 'afternoon' && (() => {
            const cx = 308, cy = 34
            const rays = Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45) * Math.PI / 180
              return { x1: Math.cos(a) * 19, y1: Math.sin(a) * 19, x2: Math.cos(a) * 27, y2: Math.sin(a) * 27 }
            })
            return (
              <g transform={`translate(${cx},${cy})`}>
                <circle cx={0} cy={0} r={36} fill="url(#sunGlow)"/>
                {/* Rays rotate slowly — one full turn every 90 seconds */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="90s"
                    repeatCount="indefinite"
                  />
                  {rays.map((r, i) => (
                    <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                      stroke="#FFD600" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85"/>
                  ))}
                </g>
                <circle cx={0} cy={0} r={13} fill="#FFF9C4"/>
                <circle cx={0} cy={0} r={10} fill="#FFE040"/>
              </g>
            )
          })()}

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

          {/* Circle-cluster clouds — natural puffy shape */}
          {scene && CLOUDS[scene].map((c, i) => {
            const f = CLOUD_COLOR[scene]
            // Morning + afternoon clouds drift slowly left→right→left
            const drifting = scene === 'morning' || scene === 'afternoon'
            const driftX   = [10, -8, 6][i] ?? 8
            const driftDur = [28, 22, 35][i] ?? 28
            return (
              <g key={i} transform={`translate(${c.x},${c.y})`} filter="url(#cloudBlur)" opacity={c.o}>
                {/* additive="sum" drifts on top of the static translate above */}
                {drifting && (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0; ${driftX} 0; 0 0`}
                    dur={`${driftDur}s`}
                    repeatCount="indefinite"
                    additive="sum"
                  />
                )}
                <g transform={`scale(${c.s})`}>
                  {/* Puff circles — varying sizes for organic shape */}
                  <circle cx={0}   cy={0}   r={22} fill={f}/>
                  <circle cx={26}  cy={-14} r={28} fill={f}/>
                  <circle cx={60}  cy={-10} r={24} fill={f}/>
                  <circle cx={88}  cy={-4}  r={19} fill={f}/>
                  <circle cx={-18} cy={6}   r={18} fill={f}/>
                  <circle cx={112} cy={4}   r={16} fill={f}/>
                  {/* Flat base fills gaps between circles */}
                  <rect x={-18} y={0} width={130} height={30} fill={f} rx={4}/>
                </g>
              </g>
            )
          })}
        </svg>

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
          {greeting ? `${greeting}, ` : <span style={{ opacity: 0 }}>·</span>}
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
          fontSize: 12, fontWeight: 500,
          color: '#9895B0',
        }}>
          {date || '\u00A0'} · Let&apos;s find your one thing.
        </p>
      </div>

    </div>
  )
}
