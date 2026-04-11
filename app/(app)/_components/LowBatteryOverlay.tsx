'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMood } from './MoodContext'

interface FocusTask {
  text: string
  id?: string
}

export default function LowBatteryOverlay() {
  const { mood, dismissLowBattery, lowBatteryDismissed } = useMood()
  const [task, setTask] = useState<FocusTask | null>(null)

  useEffect(() => {
    if (mood === 'drained' && !lowBatteryDismissed) {
      fetch('/api/focus')
        .then(r => r.json())
        .then(d => { if (d?.text) setTask(d) })
        .catch(() => {})
    }
  }, [mood, lowBatteryDismissed])

  if (mood !== 'drained' || lowBatteryDismissed) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#1E1C2E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 28px 40px',
      overflow: 'hidden',
    }}>

      {/* Ambient dots */}
      {[
        { top: '8%',  left: '15%',  size: 2, opacity: 0.25 },
        { top: '14%', left: '78%',  size: 3, opacity: 0.18 },
        { top: '28%', left: '92%',  size: 2, opacity: 0.2  },
        { top: '62%', left: '6%',   size: 2, opacity: 0.15 },
        { top: '75%', left: '88%',  size: 3, opacity: 0.2  },
        { top: '88%', left: '42%',  size: 2, opacity: 0.18 },
      ].map((dot, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: dot.top, left: dot.left,
          width: dot.size, height: dot.size,
          borderRadius: '50%',
          background: `rgba(244,165,130,${dot.opacity})`,
        }} />
      ))}

      {/* Soft radial glow behind logo */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(244,165,130,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Image src="/lumi-stacked.svg" alt="Lumi" width={90} height={90} priority style={{ marginBottom: 8, position: 'relative', zIndex: 1 }} />

      {/* Mode label */}
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 800,
        letterSpacing: '0.12em', color: 'rgba(244,165,130,0.7)',
        marginBottom: 32, position: 'relative', zIndex: 1,
      }}>
        LOW BATTERY MODE
      </p>

      {/* Warm message */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '20px 20px',
        marginBottom: 16, width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{
          fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 900,
          color: 'rgba(255,255,255,0.92)', lineHeight: 1.35,
        }}>
          You don't have to do everything today.
        </p>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5,
        }}>
          Rest is part of the work. Lumi is here.
        </p>
      </div>

      {/* One Focus — if there is one */}
      {task && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '16px 20px',
          marginBottom: 16, width: '100%',
          position: 'relative', zIndex: 1,
        }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.1em', color: 'rgba(244,165,130,0.6)', marginBottom: 6,
          }}>
            IF ANYTHING — JUST THIS
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700,
            color: 'rgba(255,255,255,0.82)', lineHeight: 1.4,
          }}>
            {task.text}
          </p>
        </div>
      )}

      {/* Talk to Lumi */}
      <Link href="/chat" style={{
        display: 'block', width: '100%', textAlign: 'center',
        padding: '15px',
        background: 'linear-gradient(135deg, rgba(244,165,130,0.85), rgba(245,201,138,0.85))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 14, border: 'none',
        fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 800,
        color: '#1E1C2E', textDecoration: 'none',
        marginBottom: 12, position: 'relative', zIndex: 1,
      }}>
        Talk to Lumi
      </Link>

      {/* Exit */}
      <button
        onClick={dismissLowBattery}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)',
          padding: '8px 0', position: 'relative', zIndex: 1,
          transition: 'color 0.2s',
        }}
      >
        I&apos;m feeling better →
      </button>

    </div>
  )
}
