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
    { color: '#3B7FC4', offset: '0%'  },
    { color: '#64A8DB', offset: '28%' },
    { color: '#F5C8A8', offset: '54%' },
    { color: '#FFBA5A', offset: '72%' },
    { color: '#FFD880', offset: '100%'},
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

// ── Stars — small r (0.25–0.55) because the SVG scales ~3.6× on desktop ──
const STARS = [
  // top strip y 3-10
  { x: 15,  y: 5,  r: 0.35, o: 0.70, d: 2.3 }, { x: 48,  y: 4,  r: 0.28, o: 0.80, d: 3.1 },
  { x: 90,  y: 7,  r: 0.38, o: 0.60, d: 2.7 }, { x: 132, y: 3,  r: 0.28, o: 0.75, d: 1.9 },
  { x: 175, y: 8,  r: 0.42, o: 0.55, d: 3.4 }, { x: 218, y: 5,  r: 0.28, o: 0.65, d: 2.5 },
  { x: 260, y: 6,  r: 0.33, o: 0.70, d: 1.7 }, { x: 300, y: 4,  r: 0.28, o: 0.60, d: 3.8 },
  { x: 342, y: 9,  r: 0.38, o: 0.75, d: 2.2 }, { x: 378, y: 5,  r: 0.28, o: 0.65, d: 2.9 },
  // upper-mid y 14-25
  { x: 8,   y: 18, r: 0.28, o: 0.55, d: 4.1 }, { x: 36,  y: 22, r: 0.48, o: 0.85, d: 3.0 },
  { x: 68,  y: 15, r: 0.28, o: 0.55, d: 2.4 }, { x: 108, y: 20, r: 0.38, o: 0.72, d: 1.6 },
  { x: 148, y: 17, r: 0.32, o: 0.60, d: 3.7 }, { x: 185, y: 24, r: 0.28, o: 0.50, d: 2.0 },
  { x: 224, y: 14, r: 0.38, o: 0.65, d: 3.5 }, { x: 265, y: 21, r: 0.28, o: 0.58, d: 2.6 },
  { x: 305, y: 19, r: 0.33, o: 0.70, d: 3.2 }, { x: 350, y: 23, r: 0.28, o: 0.50, d: 4.0 },
  { x: 383, y: 16, r: 0.38, o: 0.60, d: 2.8 },
  // mid y 30-45
  { x: 22,  y: 35, r: 0.52, o: 0.88, d: 1.8 }, { x: 58,  y: 38, r: 0.28, o: 0.52, d: 3.3 },
  { x: 98,  y: 32, r: 0.33, o: 0.65, d: 2.5 }, { x: 138, y: 42, r: 0.28, o: 0.48, d: 3.9 },
  { x: 178, y: 36, r: 0.38, o: 0.68, d: 2.1 }, { x: 218, y: 44, r: 0.28, o: 0.52, d: 4.2 },
  { x: 255, y: 33, r: 0.43, o: 0.80, d: 1.9 }, { x: 292, y: 40, r: 0.28, o: 0.55, d: 3.6 },
  { x: 328, y: 37, r: 0.33, o: 0.62, d: 2.3 }, { x: 368, y: 43, r: 0.28, o: 0.48, d: 4.4 },
  // lower-mid y 52-68
  { x: 14,  y: 55, r: 0.28, o: 0.50, d: 2.7 }, { x: 54,  y: 62, r: 0.38, o: 0.65, d: 3.4 },
  { x: 95,  y: 56, r: 0.28, o: 0.55, d: 2.0 }, { x: 138, y: 64, r: 0.33, o: 0.58, d: 3.8 },
  { x: 180, y: 58, r: 0.48, o: 0.80, d: 1.7 }, { x: 222, y: 65, r: 0.28, o: 0.50, d: 4.3 },
  { x: 262, y: 54, r: 0.33, o: 0.62, d: 2.9 }, { x: 302, y: 62, r: 0.28, o: 0.55, d: 3.1 },
  { x: 345, y: 57, r: 0.38, o: 0.68, d: 2.5 }, { x: 382, y: 65, r: 0.28, o: 0.48, d: 3.7 },
  // low y 75-95
  { x: 30,  y: 78, r: 0.28, o: 0.45, d: 3.2 }, { x: 75,  y: 84, r: 0.33, o: 0.55, d: 2.4 },
  { x: 118, y: 79, r: 0.28, o: 0.50, d: 4.1 }, { x: 162, y: 88, r: 0.38, o: 0.62, d: 2.8 },
  { x: 205, y: 82, r: 0.28, o: 0.48, d: 3.5 }, { x: 248, y: 90, r: 0.33, o: 0.55, d: 2.0 },
  { x: 290, y: 80, r: 0.28, o: 0.52, d: 4.4 }, { x: 332, y: 87, r: 0.38, o: 0.58, d: 3.0 },
  { x: 375, y: 82, r: 0.28, o: 0.45, d: 2.6 },
]

// ── Clouds per scene ──────────────────────────────────────────
// Afternoon clouds sit LOW (y≈100-108) so the beige dome clips their
// bottoms — they look like they're rising over the hill.
const CLOUDS: Record<Scene, { x: number; y: number; s: number; o: number }[]> = {
  morning:   [{ x: 30,  y: 42,  s: 0.90, o: 0.70 }, { x: 248, y: 48,  s: 0.75, o: 0.55 }],
  afternoon: [{ x: -8,  y: 58,  s: 1.30, o: 0.96 }, { x: 300, y: 62,  s: 1.10, o: 0.93 }, { x: 120, y: 24,  s: 0.70, o: 0.78 }],
  evening:   [{ x: 25,  y: 46,  s: 0.90, o: 0.62 }, { x: 258, y: 40,  s: 0.75, o: 0.50 }],
  night:     [{ x: 60,  y: 55,  s: 0.78, o: 0.28 }, { x: 258, y: 58,  s: 0.62, o: 0.20 }],
}

const CLOUD_COLOR: Record<Scene, string> = {
  morning:   '#FFF0E0',
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
          className="lumi-scene-svg"
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
                <stop offset="0%"   stopColor="#FFD980" stopOpacity="0.80"/>
                <stop offset="38%"  stopColor="#FFAA50" stopOpacity="0.40"/>
                <stop offset="100%" stopColor="#FF8020" stopOpacity="0"/>
              </radialGradient>
              {/* Soft sun orb — bright morning bloom */}
              <radialGradient id="sunOrb" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFFCE0" stopOpacity="1.00"/>
                <stop offset="20%"  stopColor="#FFE878" stopOpacity="0.80"/>
                <stop offset="50%"  stopColor="#FFBE40" stopOpacity="0.40"/>
                <stop offset="100%" stopColor="#FF9030" stopOpacity="0"/>
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
                <circle cx="72" cy="36" r="6"   fill="white"/>
                <circle cx="75" cy="33.5" r="5" fill="black"/>
              </mask>
            )}
            {/* Night crescent mask */}
            {scene === 'night' && (
              <mask id="moonMask">
                <circle cx="72" cy="36" r="7"     fill="white"/>
                <circle cx="75" cy="33" r="5.5"   fill="black"/>
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
            {scene === 'night' && <circle cx="72" cy="36" r="16" fill="url(#moonGlow)"/>}
            <circle
              cx="72" cy="36"
              r={scene === 'night' ? 7 : 6}
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

      {/* ── Horizon divider — curved on mobile, straight on desktop ── */}
      <div className="lumi-scene-dome">
        <h1 style={{
          fontFamily: 'var(--font-aegora)',
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
