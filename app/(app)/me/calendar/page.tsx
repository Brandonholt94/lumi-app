'use client'

import { useEffect, useState } from 'react'
import MeHeader from '../_components/MeHeader'
import Link from 'next/link'

export default function CalendarPage() {
  const [status, setStatus]       = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email,  setEmail]        = useState<string | null>(null)
  const [events, setEvents]       = useState<{ title: string; start: string }[]>([])
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    // Check connection status via events endpoint — returns [] if not connected
    fetch('/api/calendar/events?hours=24')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('disconnected')
          return
        }
        // If we got a response (even empty array), tokens exist
        setEvents(data.events ?? [])
        setStatus(data.connected === false ? 'disconnected' : 'connected')
      })
      .catch(() => setStatus('disconnected'))

    // Get connected email from profile endpoint
    fetch('/api/calendar/status')
      .then(r => r.json())
      .then(data => {
        if (data.connected) {
          setStatus('connected')
          setEmail(data.email)
        } else {
          setStatus('disconnected')
        }
      })
      .catch(() => {})
  }, [])

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch('/api/calendar/disconnect', { method: 'DELETE' })
    setStatus('disconnected')
    setEmail(null)
    setEvents([])
    setDisconnecting(false)
  }

  function formatTime(iso: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', {
      hour:   'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>
      <MeHeader title="Calendar" />

      <div className="px-5" style={{ paddingTop: 20 }}>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', paddingTop: 48, color: '#9895B0', fontFamily: 'var(--font-nunito-sans)', fontSize: 14 }}>
            Loading…
          </div>
        )}

        {status === 'disconnected' && (
          <>
            <div style={{
              background: 'white', borderRadius: 20, padding: '28px 20px',
              border: '1px solid rgba(45,42,62,0.07)', textAlign: 'center', marginBottom: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'rgba(143,170,224,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
                  <circle cx="128" cy="128" r="96" stroke="#8FAAE0" strokeWidth="18"/>
                  <path d="M128 72V132L168 152" stroke="#8FAAE0" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{
                fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700,
                color: '#1E1C2E', marginBottom: 8,
              }}>
                Connect your calendar
              </p>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 500,
                color: '#9895B0', lineHeight: 1.6, marginBottom: 24,
              }}>
                Lumi can see what&apos;s coming up and give you a heads-up before your next event — no more time blindness.
              </p>
              <a
                href="/api/calendar/connect"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            8,
                  background:     'linear-gradient(135deg, #F4A582, #F5C98A)',
                  borderRadius:   12,
                  padding:        '13px 24px',
                  fontFamily:     'var(--font-nunito-sans)',
                  fontSize:       14,
                  fontWeight:     800,
                  color:          '#1E1C2E',
                  textDecoration: 'none',
                }}
              >
                Connect Google Calendar
              </a>
            </div>
            <p style={{
              textAlign: 'center', fontFamily: 'var(--font-nunito-sans)',
              fontSize: 11, fontWeight: 500, color: 'rgba(45,42,62,0.35)', lineHeight: 1.5,
            }}>
              Read-only access. Lumi never creates or edits events.
            </p>
          </>
        )}

        {status === 'connected' && (
          <>
            {/* Connected status */}
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
              letterSpacing: '0.1em', color: '#9895B0', marginBottom: 8, paddingLeft: 4,
            }}>
              CONNECTED ACCOUNT
            </p>
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid rgba(45,42,62,0.07)',
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(143,170,224,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 256 256" fill="none">
                      <circle cx="128" cy="128" r="96" stroke="#8FAAE0" strokeWidth="20"/>
                      <path d="M128 72V132L168 152" stroke="#8FAAE0" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#2D2A3E' }}>
                      Google Calendar
                    </p>
                    {email && (
                      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 500, color: '#9895B0' }}>
                        {email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  style={{
                    background: 'none', border: '1.5px solid rgba(45,42,62,0.12)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 700,
                    color: '#9895B0',
                  }}
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </div>
            </div>

            {/* Today's events */}
            {events.length > 0 && (
              <>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
                  letterSpacing: '0.1em', color: '#9895B0', marginBottom: 8, paddingLeft: 4,
                }}>
                  UP NEXT TODAY
                </p>
                <div style={{
                  background: 'white', borderRadius: 16, border: '1px solid rgba(45,42,62,0.07)',
                  overflow: 'hidden', marginBottom: 20,
                }}>
                  {events.map((e, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      borderBottom: i < events.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#2D2A3E' }}>
                        {e.title}
                      </p>
                      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 500, color: '#9895B0' }}>
                        {formatTime(e.start)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {events.length === 0 && (
              <p style={{
                textAlign: 'center', fontFamily: 'var(--font-nunito-sans)',
                fontSize: 13, fontWeight: 500, color: '#9895B0', paddingTop: 8,
              }}>
                No events in the next 24 hours.
              </p>
            )}

            <p style={{
              textAlign: 'center', fontFamily: 'var(--font-nunito-sans)',
              fontSize: 11, fontWeight: 500, color: 'rgba(45,42,62,0.35)', marginTop: 8,
            }}>
              Read-only access. Lumi never creates or edits events.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
