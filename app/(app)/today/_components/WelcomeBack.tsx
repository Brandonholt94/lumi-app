'use client'

import { useEffect, useState } from 'react'

export default function WelcomeBack() {
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/seen')
      .then(r => r.json())
      .then(({ last_seen_at }) => {
        if (!last_seen_at) return // First ever visit — onboarding handles the welcome
        const hoursSince = (Date.now() - new Date(last_seen_at).getTime()) / 3_600_000
        if (hoursSince >= 24) {
          setShow(true)
          setTimeout(() => setVisible(true), 100)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => setShow(false), 300)
  }

  if (!show) return null

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 18,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(244,165,130,0.13), rgba(245,201,138,0.10))',
        border: '1px solid rgba(244,165,130,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>✦</span>
        <div>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 15, fontWeight: 700,
            color: '#1E1C2E', lineHeight: 1.2, marginBottom: 2,
          }}>
            Welcome back.
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: 12, fontWeight: 600,
            color: '#7A7890', lineHeight: 1.4,
          }}>
            No guilt — just glad you&apos;re here.
          </p>
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, flexShrink: 0,
          color: 'rgba(122,120,144,0.5)',
          fontSize: 18, lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
