'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

const PEACH  = '#F4A582'
const GOLD   = '#F5C98A'
const ROSE   = '#E8A0BF'
const DARK   = '#2D2A3E'
const DARKER = '#1E1C2E'
const BG     = '#FBF8F5'

const FEATURES = [
  { emoji: '✦', text: 'Always here — 167 hours a week' },
  { emoji: '🧠', text: 'Learns how your brain works' },
  { emoji: '💬', text: 'No shame. No streaks. No pressure.' },
  { emoji: '🎯', text: 'Picks your one thing when everything feels like too much' },
]

const PLAN_BANNER: Record<string, string> = {
  core:      "Your trial starts now. Unlimited Lumi, full context, every day.",
  companion: "Your trial starts now. You've got the full Lumi experience.",
}

export default function WelcomeScreen({ name, plan }: { name: string; plan: string }) {
  const [phase, setPhase] = useState(0)
  // 0 = nothing, 1 = greeting, 2 = subtitle, 3 = features, 4 = cta
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded') === 'true'

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setPhase(4), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 28px',
      fontFamily: 'var(--font-nunito-sans)',
    }}>

      {/* Lumi logo */}
      <div style={{
        marginBottom: 32,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.7)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <Image src="/lumi-stacked.svg" alt="Lumi" width={80} height={80} priority />
      </div>

      {/* Greeting */}
      <h1 style={{
        fontFamily: 'var(--font-aegora)',
        fontSize: '36px', fontWeight: 900,
        color: DARKER, textAlign: 'center',
        lineHeight: 1.15, marginBottom: 12,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
      }}>
        Hey, {name}. 👋
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '16px', fontWeight: 600,
        color: '#7A7890', textAlign: 'center',
        lineHeight: 1.55, maxWidth: 320,
        marginBottom: 40,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        Your brain isn't broken. It just needed something built for it. That's me.
      </p>

      {/* Upgrade success banner */}
      {upgraded && (
        <div style={{
          background: `linear-gradient(135deg, rgba(244,165,130,0.15), rgba(232,160,191,0.15))`,
          border: `1px solid rgba(244,165,130,0.3)`,
          borderRadius: 14, padding: '12px 16px',
          marginBottom: 24, width: '100%', maxWidth: 340,
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.5s ease',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px', fontWeight: 700,
            color: DARK, margin: 0, lineHeight: 1.4,
          }}>
            You&apos;re all set! {PLAN_BANNER[plan] ?? PLAN_BANNER.core}
          </p>
        </div>
      )}

      {/* Feature pills */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        width: '100%', maxWidth: 340, marginBottom: 48,
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'white',
            borderRadius: 14, padding: '13px 16px',
            border: '1px solid rgba(45,42,62,0.07)',
            boxShadow: '0 1px 6px rgba(45,42,62,0.06)',
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(6px)',
            transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{f.emoji}</span>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px', fontWeight: 600,
              color: DARK, margin: 0, lineHeight: 1.4,
            }}>{f.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        width: '100%', maxWidth: 340,
        opacity: phase >= 4 ? 1 : 0,
        transform: phase >= 4 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <a href="/today" style={{
          display: 'block', width: '100%', padding: '17px',
          borderRadius: 16, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '16px', fontWeight: 800,
          color: DARKER, textAlign: 'center',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(244,165,130,0.35)',
          transition: 'opacity 0.2s, transform 0.2s',
          boxSizing: 'border-box',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Let's begin
        </a>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px', fontWeight: 600,
          color: '#9895B0', textAlign: 'center',
          marginTop: 12,
        }}>
          No pressure. No goals. Just us.
        </p>
      </div>

    </div>
  )
}
