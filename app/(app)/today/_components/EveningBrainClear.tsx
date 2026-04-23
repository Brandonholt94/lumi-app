'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'lumi_brain_clear_dismissed'

function getDismissedDate(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DISMISS_KEY)
}

function dismissForToday() {
  const today = new Date().toDateString()
  localStorage.setItem(DISMISS_KEY, today)
}

export default function EveningBrainClear() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    // Show 8pm–3am (ADHD night owls commonly up past midnight)
    const isEvening = hour >= 20 || hour < 3
    if (!isEvening) return

    const dismissedDate = getDismissedDate()
    const today = new Date().toDateString()
    if (dismissedDate === today) return // Already dismissed today

    setVisible(true)
  }, [])

  function handleDismiss() {
    dismissForToday()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(45,42,62,0.96), rgba(30,28,46,0.98))',
        borderRadius: 22,
        padding: '20px',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: 120, height: 120,
        background: 'radial-gradient(circle, rgba(143,170,224,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.08)',
          border: 'none', borderRadius: '50%',
          width: 24, height: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Moon icon */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(143,170,224,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            fill="rgba(143,170,224,0.8)"
          />
        </svg>
      </div>

      {/* Label */}
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: 9.5, fontWeight: 800,
        letterSpacing: '0.12em', color: 'rgba(143,170,224,0.7)',
        marginBottom: 6,
      }}>
        EVENING WIND-DOWN
      </p>

      {/* Headline */}
      <p style={{
        fontFamily: 'var(--font-aegora)', fontSize: 18, fontWeight: 700,
        color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, marginBottom: 8,
      }}>
        Before you close out the day —
      </p>

      {/* Lumi message */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '10px 12px', marginBottom: 14,
      }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 500,
          color: 'rgba(255,255,255,0.6)', lineHeight: 1.55,
        }}>
          <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </span>
          Got anything still rattling around up there? Drop it in Brain Dump so your brain can actually rest tonight.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href="/capture"
          onClick={handleDismiss}
          style={{
            flex: 1, textAlign: 'center',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(143,170,224,0.85), rgba(143,170,224,0.65))',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 800,
            color: '#1E1C2E', textDecoration: 'none', display: 'block',
          }}
        >
          Brain dump →
        </Link>
        <button
          onClick={handleDismiss}
          style={{
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          I&apos;m good
        </button>
      </div>
    </div>
  )
}
