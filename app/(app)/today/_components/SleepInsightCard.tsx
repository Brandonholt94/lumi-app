'use client'

import { useEffect, useState } from 'react'

interface Insights {
  lateNightStreak: number
  brainDumpCorrelation: number | null
  recommendation: string
  surface: boolean
}

const DISMISS_KEY = 'lumi:sleep-insight-dismissed-at'

// Hide the card for 18 hours after dismiss / accept so it doesn't badger the user.
const SUPPRESS_HOURS = 18

function suppressedRecently(): boolean {
  if (typeof window === 'undefined') return false
  const ts = localStorage.getItem(DISMISS_KEY)
  if (!ts) return false
  const hours = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60)
  return hours < SUPPRESS_HOURS
}

function markSuppressed() {
  if (typeof window === 'undefined') return
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
}

export default function SleepInsightCard() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (suppressedRecently()) { setDismissed(true); return }
    fetch('/api/sleep/insights')
      .then(r => r.json())
      .then((data: Insights) => setInsights(data))
      .catch(() => setInsights(null))
  }, [])

  if (dismissed || !insights || !insights.surface) return null

  async function accept() {
    setAccepted(true)
    markSuppressed()
    await fetch('/api/sleep/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tzOffset: new Date().getTimezoneOffset() }),
    })
  }

  function dismiss() {
    markSuppressed()
    setDismissed(true)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(45, 42, 62, 0.08)',
        borderRadius: 16,
        padding: '14px 16px',
        margin: '12px 0',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        boxShadow:
          '0 12px 28px rgba(45, 42, 62, 0.08), 0 4px 10px rgba(45, 42, 62, 0.04)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#2D2A3E',
          padding: 6,
          flexShrink: 0,
          boxSizing: 'border-box',
          boxShadow: '0 4px 10px rgba(45, 42, 62, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src="/lumi-brandmark.svg" alt="Lumi" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#2D2A3E',
            lineHeight: 1.45,
            margin: 0,
            marginBottom: accepted ? 0 : 10,
          }}
        >
          {accepted
            ? "Got it. I'll go gentle tomorrow afternoon — no big asks during the crash window."
            : insights.recommendation}
        </p>

        {!accepted && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={accept}
              style={{
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                color: '#2D2A3E',
                fontWeight: 800,
                fontSize: 12,
                padding: '7px 14px',
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)',
              }}
            >
              Yes please
            </button>
            <button
              onClick={dismiss}
              style={{
                background: 'rgba(45, 42, 62, 0.06)',
                color: '#2D2A3E',
                fontWeight: 700,
                fontSize: 12,
                padding: '7px 14px',
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)',
              }}
            >
              I'm okay
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
