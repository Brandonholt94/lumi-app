'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

const STORAGE_KEY = 'lumi_tour_seen_v1'

const STEPS = [
  {
    target: 'today-header',
    eyebrow: 'TODAY',
    title: 'Your home base',
    body: "Every morning starts here. Lumi greets you, asks how you're feeling, and shows what's on your plate — no overwhelm.",
    cardPos: 'below' as const,
  },
  {
    target: 'mood',
    eyebrow: 'MOOD CHECK-IN',
    title: 'How are you feeling?',
    body: "One tap. No words required. Lumi uses your mood to adapt — quieter when you're low, more energetic when you're ready.",
    cardPos: 'below' as const,
  },
  {
    target: 'nav-capture',
    eyebrow: 'BRAIN DUMP',
    title: 'Get it out of your head',
    body: "Thoughts, tasks, worries, ideas — capture anything in seconds. Lumi holds it all so your brain doesn't have to.",
    cardPos: 'above' as const,
  },
  {
    target: 'nav-focus',
    eyebrow: 'ONE FOCUS',
    title: 'One thing at a time',
    body: 'Lumi reads your list and picks the single most important thing. No decision fatigue. Just a clear next step.',
    cardPos: 'above' as const,
  },
  {
    target: 'nav-chat',
    eyebrow: 'CHAT',
    title: 'Talk to Lumi',
    body: "Think out loud, vent, ask for help starting a task — Lumi is here for all of it. No judgment. 167 hours a week.",
    cardPos: 'above' as const,
  },
  {
    target: 'nav-insights',
    eyebrow: 'INSIGHTS',
    title: 'Your Weekly Brain Report',
    body: 'Every Sunday, Lumi writes you a personal narrative about your week — moods, focus, patterns. No spreadsheets.',
    cardPos: 'above' as const,
  },
]

type Rect = { top: number; left: number; width: number; height: number }

function getRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export default function OnboardingTour() {
  const [visible, setVisible]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const [step, setStep]         = useState(0)
  const [done, setDone]         = useState(false)
  const [rect, setRect]         = useState<Rect | null>(null)
  const [winH, setWinH]         = useState(0)
  const stepRef = useRef(step)
  stepRef.current = step

  // Mount guard (SSR safe)
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        // Small delay so the page has painted
        setTimeout(() => setVisible(true), 600)
      }
    }
  }, [])

  const measureStep = useCallback((s: number) => {
    const target = STEPS[s]?.target
    if (!target) return
    const r = getRect(target)
    setRect(r)
    setWinH(window.innerHeight)
  }, [])

  useEffect(() => {
    if (!visible) return
    measureStep(step)
    const onResize = () => measureStep(stepRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [visible, step, measureStep])

  function markDone() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDone(true)
  }

  function advance() {
    // Find next step with a visible element
    let next = step + 1
    while (next < STEPS.length) {
      const r = getRect(STEPS[next].target)
      if (r) break
      next++
    }
    if (next >= STEPS.length) {
      markDone()
    } else {
      setStep(next)
    }
  }

  function skip() { markDone() }

  function startDay() { setVisible(false) }

  if (!mounted || !visible) return null

  const PAD = 10
  const currentStep = STEPS[step]

  // ── Spotlight geometry ──────────────────────────────────────
  const spotTop    = rect ? rect.top  - PAD : 0
  const spotLeft   = rect ? rect.left - PAD : 0
  const spotWidth  = rect ? rect.width  + PAD * 2 : 0
  const spotHeight = rect ? rect.height + PAD * 2 : 0
  const winW = typeof window !== 'undefined' ? window.innerWidth : 390

  // ── Tooltip card positioning ─────────────────────────────────
  const CARD_H = 200
  const CARD_W = Math.min(320, winW - 32)
  let cardTop: number
  if (!rect) {
    cardTop = winH / 2 - CARD_H / 2
  } else if (currentStep.cardPos === 'below') {
    cardTop = spotTop + spotHeight + 12
    if (cardTop + CARD_H > winH - 16) cardTop = spotTop - CARD_H - 12
  } else {
    cardTop = spotTop - CARD_H - 12
    if (cardTop < 16) cardTop = spotTop + spotHeight + 12
  }

  const isLast = step === STEPS.length - 1 || (step < STEPS.length - 1 && !STEPS.slice(step + 1).some(s => !!getRect(s.target)))

  const overlay = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>

      {/* ── Done screen ── */}
      {done && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #2D2A3E 0%, #1E1C2E 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 28px', textAlign: 'center',
            pointerEvents: 'all',
            animation: 'lumiTourFadeIn 0.35s ease forwards',
          }}
        >
          <svg width="90" height="54" viewBox="0 0 100 60" fill="none" style={{ marginBottom: 28 }}>
            <line x1="50" y1="32" x2="50"  y2="8"  stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="50" y1="32" x2="28"  y2="16" stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="50" y1="32" x2="72"  y2="16" stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="50" y1="32" x2="15"  y2="30" stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
            <line x1="50" y1="32" x2="85"  y2="30" stroke="#F4A582" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
            <line x1="8"  y1="44" x2="92"  y2="44" stroke="#F5C98A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M 30 44 A 20 20 0 0 1 70 44" fill="#F4A582"/>
          </svg>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.15, fontFamily: 'Nunito Sans, sans-serif' }}>
            You&apos;re all set.
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 36, fontFamily: 'Nunito Sans, sans-serif' }}>
            Lumi is here whenever you need it.<br />No pressure. No rush.
          </p>
          <button
            onClick={startDay}
            style={{
              background: 'linear-gradient(135deg, #F4A582, #E8A0BF)',
              color: '#2D2A3E', fontSize: 16, fontWeight: 800,
              border: 'none', borderRadius: 16, padding: '16px 0',
              cursor: 'pointer', width: '100%', maxWidth: 320,
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            Start my day →
          </button>
        </div>
      )}

      {/* ── Spotlight masks ── */}
      {!done && rect && (
        <>
          {/* Top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: spotTop, background: 'rgba(20,18,38,0.82)', transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.max(0, winH - spotTop - spotHeight), background: 'rgba(20,18,38,0.82)', transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Left */}
          <div style={{ position: 'absolute', top: spotTop, left: 0, width: spotLeft, height: spotHeight, background: 'rgba(20,18,38,0.82)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Right */}
          <div style={{ position: 'absolute', top: spotTop, right: 0, width: Math.max(0, winW - spotLeft - spotWidth), height: spotHeight, background: 'rgba(20,18,38,0.82)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Spotlight ring */}
          <div style={{
            position: 'absolute',
            top: spotTop, left: spotLeft, width: spotWidth, height: spotHeight,
            border: '2.5px solid #F4A582',
            borderRadius: currentStep.target.startsWith('nav-') ? 14 : 18,
            boxShadow: '0 0 0 3px rgba(244,165,130,0.18), 0 0 24px rgba(244,165,130,0.25)',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </>
      )}

      {/* ── Fallback dim when no rect found ── */}
      {!done && !rect && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,38,0.82)' }} />
      )}

      {/* ── Tooltip card ── */}
      {!done && (
        <div
          style={{
            position: 'absolute',
            top: cardTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: CARD_W,
            background: 'white',
            borderRadius: 20,
            padding: '18px 18px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            pointerEvents: 'all',
            transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#F4A582', marginBottom: 6 }}>
            {currentStep.eyebrow}
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#2D2A3E', marginBottom: 8, lineHeight: 1.2 }}>
            {currentStep.title}
          </p>
          <p style={{ fontSize: 13, color: '#7A7890', lineHeight: 1.55, marginBottom: 16 }}>
            {currentStep.body}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: i === step ? '#F4A582' : '#EDE9E3',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={skip}
                style={{ fontSize: 13, fontWeight: 600, color: '#7A7890', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Skip tour
              </button>
              <button
                onClick={advance}
                style={{
                  background: '#F4A582', color: '#2D2A3E',
                  fontSize: 14, fontWeight: 800,
                  border: 'none', borderRadius: 12, padding: '10px 22px',
                  cursor: 'pointer', fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {isLast ? "Let's go →" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lumiTourFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )

  return createPortal(overlay, document.body)
}
