'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MeHeader from '../_components/MeHeader'

interface ProviderStatus {
  connected: boolean
  email:     string | null
}

interface CalendarStatus {
  google:    ProviderStatus
  microsoft: ProviderStatus
}

// ── Provider icons ────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#FBBC05" d="M24 44c5.2 0 10-1.8 13.6-4.7l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.4l-6.6 5.1C9.8 39.8 16.4 44 24 44z"/>
    <path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.2C37.3 38.7 44 33.9 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
)

const OutlookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#0078D4"/>
    <rect x="6" y="10" width="22" height="28" rx="3" fill="white" opacity="0.15"/>
    <rect x="6" y="10" width="22" height="28" rx="3" stroke="white" strokeWidth="1.5" fill="none"/>
    <ellipse cx="17" cy="24" rx="7" ry="8" fill="white"/>
    <ellipse cx="17" cy="24" rx="4" ry="5.5" fill="#0078D4"/>
    <rect x="28" y="18" width="14" height="20" rx="2" fill="white" opacity="0.9"/>
    <line x1="28" y1="24" x2="42" y2="24" stroke="#0078D4" strokeWidth="1"/>
    <line x1="28" y1="29" x2="42" y2="29" stroke="#0078D4" strokeWidth="1"/>
    <line x1="28" y1="34" x2="38" y2="34" stroke="#0078D4" strokeWidth="1"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path fill="#1D1D1F" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.73 2.98.77 1.14-.24 2.23-.93 3.43-.84 1.46.12 2.56.68 3.28 1.73-2.99 1.79-2.28 5.75.3 6.86-.5 1.35-1.17 2.69-2 3.34zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

// ── Provider card ─────────────────────────────────────────────

interface ProviderCardProps {
  name:         string
  icon:         React.ReactNode
  color:        string
  status:       ProviderStatus | null
  connectHref:  string
  onDisconnect: () => void
  disconnecting: boolean
  iosOnly?:     boolean
}

function ProviderCard({
  name, icon, color, status, connectHref, onDisconnect, disconnecting, iosOnly,
}: ProviderCardProps) {
  const connected = status?.connected ?? false

  return (
    <div style={{
      background:   'white',
      borderRadius: 16,
      border:       '1px solid rgba(45,42,62,0.07)',
      overflow:     'hidden',
      marginBottom: 10,
    }}>
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '14px 16px',
      }}>
        {/* Left: icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   10,
            background:     `${color}18`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize:   13,
              fontWeight: 700,
              color:      '#2D2A3E',
              marginBottom: connected && status?.email ? 2 : 0,
            }}>
              {name}
            </p>
            {connected && status?.email && (
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 500, color: '#9895B0' }}>
                {status.email}
              </p>
            )}
            {iosOnly && !connected && (
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 500, color: '#9895B0' }}>
                iOS app only
              </p>
            )}
          </div>
        </div>

        {/* Right: action */}
        {iosOnly ? (
          <div style={{
            background:   'rgba(45,42,62,0.05)',
            borderRadius: 8,
            padding:      '6px 12px',
            fontFamily:   'var(--font-nunito-sans)',
            fontSize:     11,
            fontWeight:   700,
            color:        '#9895B0',
          }}>
            Coming soon
          </div>
        ) : connected ? (
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            style={{
              background:   'none',
              border:       '1.5px solid rgba(45,42,62,0.12)',
              borderRadius: 8,
              padding:      '6px 12px',
              cursor:       'pointer',
              fontFamily:   'var(--font-nunito-sans)',
              fontSize:     12,
              fontWeight:   700,
              color:        '#9895B0',
            }}
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <a
            href={connectHref}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              background:     `${color}18`,
              border:         `1.5px solid ${color}44`,
              borderRadius:   8,
              padding:        '6px 14px',
              fontFamily:     'var(--font-nunito-sans)',
              fontSize:       12,
              fontWeight:     800,
              color:          color,
              textDecoration: 'none',
            }}
          >
            Connect
          </a>
        )}
      </div>

      {/* Connected badge */}
      {connected && (
        <div style={{
          background:  'rgba(99,190,123,0.08)',
          borderTop:   '1px solid rgba(99,190,123,0.15)',
          padding:     '7px 16px',
          display:     'flex',
          alignItems:  'center',
          gap:         6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#63BE7B" opacity="0.2"/>
            <path d="M7 12.5l3.5 3.5L17 9" stroke="#3DA85A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 700, color: '#3DA85A' }}>
            Connected
          </span>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function CalendarPage() {
  const searchParams = useSearchParams()
  const [calStatus,  setCalStatus]  = useState<CalendarStatus | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [disconnectingGoogle,    setDisconnectingGoogle]    = useState(false)
  const [disconnectingMicrosoft, setDisconnectingMicrosoft] = useState(false)

  useEffect(() => {
    fetch('/api/calendar/status')
      .then(r => r.json())
      .then(data => setCalStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Show success banner when redirected back from OAuth
  const justConnected = searchParams.get('connected') === 'true'

  async function handleDisconnectGoogle() {
    setDisconnectingGoogle(true)
    await fetch('/api/calendar/disconnect', { method: 'DELETE' })
    setCalStatus(prev => prev ? { ...prev, google: { connected: false, email: null } } : prev)
    setDisconnectingGoogle(false)
  }

  async function handleDisconnectMicrosoft() {
    setDisconnectingMicrosoft(true)
    await fetch('/api/calendar/microsoft/disconnect', { method: 'DELETE' })
    setCalStatus(prev => prev ? { ...prev, microsoft: { connected: false, email: null } } : prev)
    setDisconnectingMicrosoft(false)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>
      <MeHeader title="Calendar" />

      <div className="px-5" style={{ paddingTop: 20 }}>

        {/* Just-connected banner */}
        {justConnected && (
          <div style={{
            background:   'rgba(99,190,123,0.1)',
            border:       '1px solid rgba(99,190,123,0.25)',
            borderRadius: 12,
            padding:      '10px 14px',
            marginBottom: 16,
            display:      'flex',
            alignItems:   'center',
            gap:          8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#63BE7B" opacity="0.2"/>
              <path d="M7 12.5l3.5 3.5L17 9" stroke="#3DA85A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#3DA85A' }}>
              Calendar connected! Lumi can now see your upcoming events.
            </p>
          </div>
        )}

        {/* Intro copy */}
        <p style={{
          fontFamily:   'var(--font-nunito-sans)',
          fontSize:     13,
          fontWeight:   500,
          color:        '#9895B0',
          lineHeight:   1.6,
          marginBottom: 20,
        }}>
          Connect your calendar and Lumi will give you a heads-up before your next event — no more time blindness.
        </p>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 32, color: '#9895B0', fontFamily: 'var(--font-nunito-sans)', fontSize: 14 }}>
            Loading…
          </div>
        )}

        {/* Provider list */}
        {!loading && (
          <>
            <p style={{
              fontFamily:    'var(--font-nunito-sans)',
              fontSize:      '10px',
              fontWeight:    800,
              letterSpacing: '0.1em',
              color:         '#9895B0',
              marginBottom:  10,
            }}>
              CALENDAR PROVIDERS
            </p>

            <ProviderCard
              name="Google Calendar"
              icon={<GoogleIcon />}
              color="#4285F4"
              status={calStatus?.google ?? null}
              connectHref="/api/calendar/connect"
              onDisconnect={handleDisconnectGoogle}
              disconnecting={disconnectingGoogle}
            />

            <ProviderCard
              name="Outlook / Microsoft"
              icon={<OutlookIcon />}
              color="#0078D4"
              status={calStatus?.microsoft ?? null}
              connectHref="/api/calendar/microsoft/connect"
              onDisconnect={handleDisconnectMicrosoft}
              disconnecting={disconnectingMicrosoft}
            />

            <ProviderCard
              name="Apple Calendar"
              icon={<AppleIcon />}
              color="#1D1D1F"
              status={null}
              connectHref="#"
              onDisconnect={() => {}}
              disconnecting={false}
              iosOnly
            />

            <p style={{
              textAlign:  'center',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize:   11,
              fontWeight: 500,
              color:      'rgba(45,42,62,0.35)',
              lineHeight: 1.5,
              marginTop:  20,
            }}>
              Read-only access. Lumi never creates or edits events.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
