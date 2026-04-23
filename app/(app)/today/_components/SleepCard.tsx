'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SleepLog } from '@/app/api/sleep/route'

function durStr(dur: number) {
  const h    = Math.floor(dur)
  const half = dur % 1 !== 0
  return half ? `${h}h 30m` : `${h}h`
}

const QUALITY_LABEL: Record<string, string> = {
  great: 'Rested',
  okay:  'Got through it',
  rough: 'Rough night',
}

const QUALITY_COLOR: Record<string, string> = {
  great: '#8FAAE0',
  okay:  '#C8A030',
  rough: '#E8A0BF',
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="#8FAAE0">
      <path d="M244,96a12,12,0,0,1-12,12H220v12a12,12,0,0,1-24,0V108H184a12,12,0,0,1,0-24h12V72a12,12,0,0,1,24,0V84h12A12,12,0,0,1,244,96ZM144,60h4v4a12,12,0,0,0,24,0V60h4a12,12,0,0,0,0-24h-4V32a12,12,0,0,0-24,0v4h-4a12,12,0,0,0,0,24Zm75.81,90.38A12,12,0,0,1,222,162.3,100,100,0,1,1,93.7,34a12,12,0,0,1,15.89,13.6A85.12,85.12,0,0,0,108,64a84.09,84.09,0,0,0,84,84,85.22,85.22,0,0,0,16.37-1.59A12,12,0,0,1,219.81,150.38ZM190,172A108.13,108.13,0,0,1,84,66,76,76,0,1,0,190,172Z"/>
    </svg>
  )
}

export default function SleepCard() {
  const [log,     setLog]     = useState<SleepLog | null | 'loading'>('loading')
  const [hasPrev, setHasPrev] = useState(false)

  useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset()
    fetch(`/api/sleep?tzOffset=${tzOffset}`)
      .then(r => r.json())
      .then(({ today, history }) => {
        setLog(today ?? null)
        setHasPrev((history ?? []).length > 0)
      })
      .catch(() => setLog(null))
  }, [])

  // Don't render anything while loading
  if (log === 'loading') return null

  return (
    <Link
      href="/me/sleep"
      style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}
    >
      <div style={{
        background: log
          ? 'linear-gradient(135deg, rgba(143,170,224,0.10), rgba(184,174,204,0.08))'
          : !hasPrev
            ? 'linear-gradient(135deg, rgba(143,170,224,0.06), rgba(184,174,204,0.04))'
            : 'white',
        border: `1.5px solid ${log ? 'rgba(143,170,224,0.25)' : !hasPrev ? 'rgba(143,170,224,0.18)' : 'rgba(45,42,62,0.08)'}`,
        borderRadius: 18,
        padding: log ? '9px 14px' : '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: log ? 10 : 12,
        transition: 'padding 0.2s ease',
      }}>

        {/* Icon bubble — smaller when filled */}
        <div style={{
          width: log ? 32 : 40, height: log ? 32 : 40,
          borderRadius: log ? 10 : 12, flexShrink: 0,
          background: log ? 'rgba(143,170,224,0.15)' : 'rgba(45,42,62,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <MoonIcon />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px', fontWeight: 800,
            letterSpacing: '0.06em', color: '#9895B0',
            marginBottom: log ? 1 : 3,
          }}>
            {!log && !hasPrev ? 'SLEEP TRACKING' : 'LAST NIGHT'}
          </p>
          {log ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '14px', fontWeight: 800, color: '#1E1C2E',
              }}>
                {durStr(log.duration)}
              </span>
              {log.quality && (
                <span style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '11px', fontWeight: 700,
                  color: QUALITY_COLOR[log.quality],
                  background: `${QUALITY_COLOR[log.quality]}18`,
                  borderRadius: 6, padding: '2px 7px',
                }}>
                  {QUALITY_LABEL[log.quality]}
                </span>
              )}
            </div>
          ) : !hasPrev ? (
            /* Brand new user — introduce the feature */
            <div>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px', fontWeight: 700, color: '#1E1C2E',
                marginBottom: 1,
              }}>
                Log your sleep
              </p>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '11px', fontWeight: 500, color: '#9895B0',
              }}>
                Track how rest affects your day
              </p>
            </div>
          ) : (
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px', fontWeight: 600, color: '#9895B0',
            }}>
              How'd you sleep?
            </p>
          )}
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" stroke="rgba(143,170,224,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

      </div>
    </Link>
  )
}
