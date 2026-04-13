'use client'

import { useEffect, useState } from 'react'
import ProfileButton from '../../_components/ProfileButton'

interface Props { firstName: string }

type Scene = 'morning' | 'afternoon' | 'evening' | 'night'

const STARS = [
  { x: 25,  y: 18, r: 1.2, o: 0.85 }, { x: 72,  y: 10, r: 0.8, o: 0.65 },
  { x: 128, y: 30, r: 1.4, o: 0.9  }, { x: 183, y:  8, r: 0.9, o: 0.7  },
  { x: 248, y: 22, r: 1.3, o: 0.85 }, { x: 312, y: 14, r: 0.8, o: 0.6  },
  { x: 366, y: 26, r: 1.2, o: 0.8  }, { x: 45,  y: 52, r: 0.9, o: 0.65 },
  { x: 103, y: 62, r: 1.3, o: 0.75 }, { x: 162, y: 44, r: 0.8, o: 0.6  },
  { x: 220, y: 56, r: 1.2, o: 0.8  }, { x: 282, y: 40, r: 0.9, o: 0.7  },
  { x: 345, y: 48, r: 1.1, o: 0.75 }, { x: 16,  y: 82, r: 0.8, o: 0.55 },
  { x: 155, y: 92, r: 0.9, o: 0.65 }, { x: 235, y: 76, r: 1.3, o: 0.8  },
  { x: 305, y: 86, r: 0.8, o: 0.6  }, { x: 375, y: 70, r: 1.1, o: 0.75 },
  { x: 68,  y: 115, r: 0.8, o: 0.5 }, { x: 190, y: 120, r: 0.9, o: 0.55 },
  { x: 335, y: 108, r: 0.8, o: 0.5 }, { x: 52,  y: 32,  r: 0.7, o: 0.5 },
  { x: 288, y: 64,  r: 0.7, o: 0.55 },{ x: 142, y: 100, r: 0.7, o: 0.45 },
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

// Hill colours — dark silhouette, varies subtly per scene
const HILL_COLOR: Record<Scene, string> = {
  morning:   '#1A1428',
  afternoon: '#1C2640',
  evening:   '#18112A',
  night:     '#0C0A1A',
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

  // Afternoon sky is lighter — use dark text, all others use light text
  const lightText  = scene !== 'afternoon'
  const textColor  = lightText ? '#F5F3F0' : '#1E1C2E'
  const textMuted  = lightText ? 'rgba(245,243,240,0.68)' : 'rgba(30,28,46,0.55)'
  const hillColor  = scene ? HILL_COLOR[scene] : '#1A1428'

  // Hill path — smooth single bump, peaks at centre
  // ViewBox 390×260. Hill starts at y=195, peaks at y=168 centre.
  const hill = 'M 0 260 L 0 200 C 85 193, 158 172, 195 168 C 232 172, 305 193, 390 200 L 390 260 Z'

  return (
    // overflow-hidden clips the SVG at the container edge — the hill
    // sits flush so the beige content below has a clean curve above it
    <div style={{ position: 'relative', width: '100%', flexShrink: 0, overflow: 'hidden' }}>

      <svg
        viewBox="0 0 390 260"
        width="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          {/* ── Sky gradients ── */}
          {scene === 'morning' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1E1C2E" />
              <stop offset="20%"  stopColor="#4A2260" />
              <stop offset="48%"  stopColor="#E8A0BF" />
              <stop offset="72%"  stopColor="#F4A582" />
              <stop offset="100%" stopColor="#F5C98A" />
            </linearGradient>
          )}
          {scene === 'afternoon' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4A7AB8" />
              <stop offset="50%"  stopColor="#8FAAE0" />
              <stop offset="100%" stopColor="#C0D8F0" />
            </linearGradient>
          )}
          {scene === 'evening' && (
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1A1228" />
              <stop offset="22%"  stopColor="#5E2D5E" />
              <stop offset="58%"  stopColor="#E8A0BF" />
              <stop offset="100%" stopColor="#F4A582" />
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

          {/* Sun glow */}
          {(scene === 'morning' || scene === 'afternoon' || scene === 'evening') && (
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#F5C98A" stopOpacity="0.95" />
              <stop offset="40%"  stopColor="#F4A582" stopOpacity="0.5"  />
              <stop offset="100%" stopColor="#F4A582" stopOpacity="0"    />
            </radialGradient>
          )}

          {/* Moon glow */}
          {scene === 'night' && (
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E0D8F8" stopOpacity="0.75" />
              <stop offset="55%"  stopColor="#B8A8E0" stopOpacity="0.2"  />
              <stop offset="100%" stopColor="#B8A8E0" stopOpacity="0"    />
            </radialGradient>
          )}

          {/* Hill gradient — adds depth: slightly lighter at the crest */}
          <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={hillColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={hillColor} stopOpacity="1"    />
          </linearGradient>
        </defs>

        {/* Sky fill */}
        <rect width="390" height="260" fill={scene ? 'url(#skyGrad)' : '#1E1C2E'} />

        {/* ── Stars (night) ── */}
        {scene === 'night' && STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={s.o} />
        ))}

        {/* ── Morning: sun peeking over the hill crest ── */}
        {scene === 'morning' && <>
          <circle cx={195} cy={260} r={110} fill="url(#sunGlow)" />
          <circle cx={195} cy={172} r={36} fill="#F5C98A" />
          <circle cx={195} cy={172} r={27} fill="#FFE58A" />
        </>}

        {/* ── Afternoon: sun high and bright ── */}
        {scene === 'afternoon' && <>
          <circle cx={310} cy={60} r={52} fill="url(#sunGlow)" />
          <circle cx={310} cy={60} r={22} fill="#FFE896" />
          <circle cx={310} cy={60} r={14} fill="#FFFBD0" />
        </>}

        {/* ── Evening: sun setting on horizon ── */}
        {scene === 'evening' && <>
          <circle cx={195} cy={260} r={105} fill="url(#sunGlow)" />
          <circle cx={195} cy={174} r={32} fill="#F4A582" />
          <circle cx={195} cy={174} r={23} fill="#F5C98A" />
        </>}

        {/* ── Night: crescent moon ── */}
        {scene === 'night' && <>
          <circle cx={305} cy={64} r={46} fill="url(#moonGlow)" />
          <circle cx={305} cy={64} r={20} fill="#EAE2FA" />
          <circle cx={315} cy={58} r={16} fill="#1E1C2E" fillOpacity={0.9} />
        </>}

        {/* ── Hill silhouette ── */}
        <path d={hill} fill="url(#hillGrad)" />

        {/* Subtle highlight line along the crest */}
        <path
          d="M 0 200 C 85 193, 158 172, 195 168 C 232 172, 305 193, 390 200"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
      </svg>

      {/* ── Greeting overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: '22px 20px 0',
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
              textShadow: lightText ? '0 1px 12px rgba(0,0,0,0.22)' : 'none',
            }}>
              {greeting
                ? `${greeting.emoji} ${greeting.text}, `
                : <span style={{ opacity: 0 }}>·</span>}
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
              textShadow: lightText ? '0 1px 6px rgba(0,0,0,0.15)' : 'none',
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
