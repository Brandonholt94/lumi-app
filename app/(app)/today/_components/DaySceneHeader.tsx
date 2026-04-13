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

// Sky gradients — top to bottom per scene
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

// Dark hill tint per scene
const HILL: Record<Scene, string> = {
  morning:   '#15101F',
  afternoon: '#121B2E',
  evening:   '#110D1E',
  night:     '#08061A',
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

  // Wide dome bezier — both control points pulled high, crest ≈ y 75 in 180px viewBox
  const dome = 'M -5 180 C -5 38, 395 38, 395 180 Z'

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
                ? SKY[scene].map((color, i) => (
                    <stop key={i} offset={SKY_STOPS[scene][i]} stopColor={color} />
                  ))
                : <stop offset="0%" stopColor="#09071A" />}
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect width="390" height="180" fill="url(#skyGrad)" />

          {/* Dome hill — nothing inside, purely the silhouette */}
          <path d={dome} fill={hillColor} />
        </svg>

        {/* Profile button floats top-right in the sky */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <ProfileButton />
        </div>
      </div>

      {/* ── Greeting — sits below the hill in the content area ── */}
      <div style={{
        background: '#FBF8F5',
        padding: '18px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
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
      </div>

    </div>
  )
}
