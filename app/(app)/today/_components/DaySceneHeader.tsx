'use client'

import { useEffect, useState } from 'react'
import ProfileButton from '../../_components/ProfileButton'

interface Props { firstName: string }

type Scene = 'morning' | 'afternoon' | 'evening' | 'night'

// Pre-set star positions so they don't shift on re-render
const STARS = [
  { x: 25,  y: 16, r: 1.2, o: 0.85 }, { x: 72,  y: 10, r: 0.8, o: 0.65 },
  { x: 128, y: 26, r: 1.4, o: 0.9  }, { x: 183, y:  8, r: 0.9, o: 0.7  },
  { x: 248, y: 20, r: 1.3, o: 0.85 }, { x: 312, y: 14, r: 0.8, o: 0.6  },
  { x: 366, y: 24, r: 1.2, o: 0.8  }, { x: 45,  y: 46, r: 0.9, o: 0.65 },
  { x: 103, y: 56, r: 1.3, o: 0.75 }, { x: 162, y: 40, r: 0.8, o: 0.6  },
  { x: 220, y: 50, r: 1.2, o: 0.8  }, { x: 282, y: 36, r: 0.9, o: 0.7  },
  { x: 345, y: 44, r: 1.1, o: 0.75 }, { x: 16,  y: 76, r: 0.8, o: 0.55 },
  { x: 155, y: 85, r: 0.9, o: 0.65 }, { x: 235, y: 70, r: 1.3, o: 0.8  },
  { x: 305, y: 80, r: 0.8, o: 0.6  }, { x: 375, y: 66, r: 1.1, o: 0.75 },
  { x: 68,  y: 105, r: 0.8, o: 0.5 }, { x: 190, y: 110, r: 0.9, o: 0.55 },
  { x: 335, y: 100, r: 0.8, o: 0.5 }, { x: 52,  y: 28, r: 0.7, o: 0.5  },
  { x: 288, y: 58, r: 0.7, o: 0.55 }, { x: 142, y: 92, r: 0.7, o: 0.45 },
]

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

export default function DaySceneHeader({ firstName }: Props) {
  const [scene,    setScene]    = useState<Scene | null>(null)
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null)
  const [date,     setDate]     = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setScene(getScene(hour))
    setGreeting(getGreeting(hour))
    setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  // Afternoon is the only scene with a light sky at the top
  const lightText = scene !== 'afternoon'
  const textColor = lightText ? '#F5F3F0' : '#1E1C2E'
  const textMuted = lightText ? 'rgba(245,243,240,0.65)' : 'rgba(30,28,46,0.55)'

  return (
    <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>

      {/* ── Scene SVG ── */}
      <svg
        viewBox="0 0 390 190"
        width="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Sky gradients — only one rendered at a time */}
          {scene === 'morning' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1E1C2E" />
              <stop offset="22%"  stopColor="#4A2260" />
              <stop offset="48%"  stopColor="#E8A0BF" />   {/* Dawn Rose */}
              <stop offset="72%"  stopColor="#F4A582" />   {/* Peach */}
              <stop offset="100%" stopColor="#F5C98A" />   {/* Gold */}
            </linearGradient>
          )}
          {scene === 'afternoon' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#5B8CC8" />
              <stop offset="50%"  stopColor="#8FAAE0" />   {/* Brand Sky Blue */}
              <stop offset="100%" stopColor="#C8DCEF" />
            </linearGradient>
          )}
          {scene === 'evening' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1E1C2E" />
              <stop offset="24%"  stopColor="#5E2D5E" />
              <stop offset="58%"  stopColor="#E8A0BF" />   {/* Dawn Rose */}
              <stop offset="100%" stopColor="#F4A582" />   {/* Peach */}
            </linearGradient>
          )}
          {scene === 'night' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#09071A" />
              <stop offset="38%"  stopColor="#1E1C2E" />
              <stop offset="74%"  stopColor="#2D2A3E" />
              <stop offset="100%" stopColor="#3A3660" />
            </linearGradient>
          )}

          {/* Sun glow (morning, afternoon, evening) */}
          {(scene === 'morning' || scene === 'afternoon' || scene === 'evening') && (
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#F5C98A" stopOpacity="0.9" />
              <stop offset="45%"  stopColor="#F4A582" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F4A582" stopOpacity="0"   />
            </radialGradient>
          )}

          {/* Moon glow (night) */}
          {scene === 'night' && (
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E0D8F8" stopOpacity="0.7" />
              <stop offset="55%"  stopColor="#B8A8E0" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#B8A8E0" stopOpacity="0"   />
            </radialGradient>
          )}
        </defs>

        {/* ── Sky background ── */}
        <rect width="390" height="190" fill={scene ? 'url(#skyGrad)' : '#1E1C2E'} />

        {/* ── Stars (night only) ── */}
        {scene === 'night' && STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={s.o} />
        ))}

        {/* ── Morning sun — half rising over the hill ── */}
        {scene === 'morning' && (
          <>
            {/* Soft glow halo */}
            <circle cx={195} cy={190} r={95} fill="url(#sunGlow)" />
            {/* Sun body — centred at hill crest, half-hidden */}
            <circle cx={195} cy={150} r={34} fill="#F5C98A" />
            <circle cx={195} cy={150} r={26} fill="#FFE58A" />
          </>
        )}

        {/* ── Afternoon sun — high in sky ── */}
        {scene === 'afternoon' && (
          <>
            <circle cx={310} cy={46} r={46} fill="url(#sunGlow)" />
            <circle cx={310} cy={46} r={20} fill="#FFE896" />
            <circle cx={310} cy={46} r={13} fill="#FFF5CC" />
          </>
        )}

        {/* ── Evening sun — setting on the horizon ── */}
        {scene === 'evening' && (
          <>
            <circle cx={195} cy={190} r={88} fill="url(#sunGlow)" />
            <circle cx={195} cy={152} r={30} fill="#F4A582" />
            <circle cx={195} cy={152} r={22} fill="#F5C98A" />
          </>
        )}

        {/* ── Night moon + crescent shadow ── */}
        {scene === 'night' && (
          <>
            <circle cx={305} cy={52} r={42} fill="url(#moonGlow)" />
            <circle cx={305} cy={52} r={18} fill="#EAE2FA" />
            {/* Crescent cutout — slightly offset circle in sky colour */}
            <circle cx={314} cy={47} r={15} fill="#1E1C2E" fillOpacity={0.88} />
          </>
        )}

        {/* ── Hill — page bg colour so it melts into the content ── */}
        <path
          d="M 0 190 L 0 166 C 75 161, 148 147, 195 144 C 242 147, 315 161, 390 166 L 390 190 Z"
          fill="#FBF8F5"
        />
        {/* Subtle edge line for depth */}
        <path
          d="M 0 166 C 75 161, 148 147, 195 144 C 242 147, 315 161, 390 166"
          fill="none"
          stroke="rgba(45,42,62,0.07)"
          strokeWidth="1.5"
        />
      </svg>

      {/* ── Text overlay (pointer-events passthrough to SVG, re-enabled on content) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: '20px 20px 0',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 26, fontWeight: 900,
              color: textColor,
              lineHeight: 1.1, marginBottom: 3,
              textShadow: lightText ? '0 1px 10px rgba(0,0,0,0.18)' : 'none',
            }}>
              {greeting ? `${greeting.emoji} ${greeting.text}, ` : <span style={{ opacity: 0 }}>·</span>}
              {greeting && (
                <span style={{
                  background: scene === 'afternoon'
                    ? 'linear-gradient(90deg, #F4A582, #F5C98A, #8FAAE0)'
                    : 'linear-gradient(90deg, #F5C98A, #E8A0BF)',
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
              color: textMuted,
              textShadow: lightText ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
            }}>
              {date || '\u00A0'} · Let&apos;s find your one thing.
            </p>
          </div>
          <ProfileButton />
        </div>
      </div>

    </div>
  )
}
