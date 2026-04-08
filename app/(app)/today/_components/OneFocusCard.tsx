'use client'

import { useState } from 'react'
import Link from 'next/link'

interface OneFocusCardProps {
  task: string
  lumiMessage: string
}

export default function OneFocusCard({ task, lumiMessage }: OneFocusCardProps) {
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div
        className="rounded-[22px] p-5 mb-4 flex flex-col items-center text-center gap-2"
        style={{ background: '#1E1C2E' }}
      >
        <span style={{ fontSize: '28px', lineHeight: 1 }}>✦</span>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '18px',
            fontWeight: 700,
            color: '#F5F3F0',
            lineHeight: 1.3,
          }}
        >
          That&apos;s the one.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'rgba(245,243,240,0.55)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </span>
          You did it. That&apos;s not nothing — that&apos;s the whole thing.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-[22px] p-4 mb-4 relative overflow-hidden"
      style={{ background: '#1E1C2E' }}
    >
      {/* Subtle glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-40px', right: '-40px',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(244,165,130,0.14) 0%, transparent 70%)',
        }}
      />

      <p
        className="mb-2"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.13em',
          color: '#F4A582',
        }}
      >
        ✦ YOUR ONE FOCUS TODAY
      </p>

      <p
        className="mb-3"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '18px',
          fontWeight: 700,
          color: '#F5F3F0',
          lineHeight: 1.25,
        }}
      >
        {task}
      </p>

      <div
        className="rounded-[11px] p-[10px_12px] mb-3"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'rgba(245,243,240,0.62)',
            lineHeight: 1.55,
          }}
        >
          <span style={{ color: '#F4A582', fontWeight: 700 }}>Lumi:</span>{' '}
          {lumiMessage}
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/focus"
          className="flex-1 block text-center rounded-full py-[13px] transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 800,
            color: '#1E1C2E',
          }}
        >
          Let&apos;s start →
        </Link>

        <button
          onClick={() => setDone(true)}
          className="rounded-full py-[13px] px-4 transition-all hover:opacity-80 active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: 'rgba(245,243,240,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          Done ✓
        </button>
      </div>
    </div>
  )
}
