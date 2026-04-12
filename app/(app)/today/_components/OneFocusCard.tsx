'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useMood } from '../../_components/MoodContext'

interface FocusResult {
  capture_id: string | null
  task: string | null
  lumi_message: string
}

export default function OneFocusCard() {
  const { mood } = useMood()
  const [focus, setFocus] = useState<FocusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  const fetchFocus = useCallback(async () => {
    setLoading(true)
    setDone(false)
    try {
      const params = mood ? `?mood=${mood}` : ''
      const res = await fetch(`/api/focus${params}`)
      const data = await res.json()
      setFocus(data)
    } finally {
      setLoading(false)
    }
  }, [mood])

  useEffect(() => {
    fetchFocus()
  }, [fetchFocus])

  async function handleDone() {
    if (focus?.capture_id) {
      await fetch('/api/captures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: focus.capture_id, completed: true }),
      })
    }
    setDone(true)
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="rounded-[22px] p-4 mb-4"
        style={{ background: '#1E1C2E', minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%', background: '#F4A582',
                animation: 'dotPulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes dotPulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    )
  }

  // Done state
  if (done) {
    return (
      <div
        className="rounded-[22px] p-5 mb-4 flex flex-col items-center text-center gap-2"
        style={{ background: '#1E1C2E' }}
      >
        <span style={{ fontSize: '26px', lineHeight: 1 }}>✦</span>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', fontWeight: 700, color: '#F5F3F0', lineHeight: 1.3 }}>
          That&apos;s the one.
        </p>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12.5px', fontWeight: 600, color: 'rgba(245,243,240,0.55)', lineHeight: 1.5 }}>
          <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </span>
          You did it. That&apos;s not nothing — that&apos;s the whole thing.
        </p>
        <button
          onClick={fetchFocus}
          style={{
            marginTop: 4,
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'rgba(245,243,240,0.4)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          See next task →
        </button>
      </div>
    )
  }

  // Empty state — no task captures yet
  if (!focus?.task) {
    return (
      <div
        className="rounded-[22px] p-4 mb-4 relative overflow-hidden"
        style={{ background: '#1E1C2E' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(244,165,130,0.14) 0%, transparent 70%)' }}
        />
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.13em', color: '#F4A582', marginBottom: 8 }}>
          ✦ YOUR ONE FOCUS TODAY
        </p>
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '17px', fontWeight: 700, color: 'rgba(245,243,240,0.5)', lineHeight: 1.3, marginBottom: 12 }}>
          Nothing in the queue yet.
        </p>
        <div className="rounded-[11px] p-[10px_12px] mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11.5px', fontWeight: 600, color: 'rgba(245,243,240,0.62)', lineHeight: 1.55 }}>
            <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </span>
            {focus?.lumi_message ?? "Add something to Brain Dump and I'll pick your one thing."}
          </p>
        </div>
        <Link
          href="/capture"
          className="block text-center rounded-full py-[13px] transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #F4A582, #F5C98A)', fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800, color: '#1E1C2E' }}
        >
          Open Brain Dump →
        </Link>
      </div>
    )
  }

  // Main focus card
  return (
    <div
      className="rounded-[22px] p-4 mb-4 relative overflow-hidden"
      style={{ background: '#1E1C2E' }}
    >
      <div
        className="absolute pointer-events-none"
        style={{ top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(244,165,130,0.14) 0%, transparent 70%)' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.13em', color: '#F4A582' }}>
          ✦ YOUR ONE FOCUS TODAY
        </p>
        {(mood === 'drained' || mood === 'foggy') && (
          <span style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 700,
            color: 'rgba(232,160,191,0.8)', letterSpacing: '0.06em',
          }}>
            easy wins only
          </span>
        )}
      </div>

      <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', fontWeight: 700, color: '#F5F3F0', lineHeight: 1.25, marginBottom: 12 }}>
        {focus.task}
      </p>

      <div className="rounded-[11px] p-[10px_12px] mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11.5px', fontWeight: 600, color: 'rgba(245,243,240,0.62)', lineHeight: 1.55 }}>
          <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </span>
          {focus.lumi_message}
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/focus"
          className="flex-1 block text-center rounded-full py-[13px] transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #F4A582, #F5C98A)', fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800, color: '#1E1C2E' }}
        >
          Let&apos;s start →
        </Link>
        <button
          onClick={handleDone}
          className="rounded-full py-[13px] px-4 transition-all hover:opacity-80 active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800, color: 'rgba(245,243,240,0.6)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}
        >
          Done ✓
        </button>
      </div>
    </div>
  )
}
