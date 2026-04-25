'use client'

import { useState, useEffect } from 'react'
import MeHeader from '../_components/MeHeader'

type Prefs = {
  morning_checkin: boolean
  focus_reminder: boolean
  med_reminder: boolean
  evening_checkin: boolean
  weekly_report: boolean
}

type Toggle = {
  id: keyof Prefs
  label: string
  desc: string
  icon: string
}

const TOGGLES: Toggle[] = [
  { id: 'morning_checkin', label: 'Morning check-in',    desc: 'Lumi says good morning around 8am',              icon: '🌅' },
  { id: 'focus_reminder',  label: 'Focus reminders',     desc: 'Gentle nudge when you have tasks waiting',       icon: '🎯' },
  { id: 'med_reminder',    label: 'Medication reminders',desc: 'Based on your medication log schedule',           icon: '💊' },
  { id: 'evening_checkin', label: 'Evening reflection',  desc: 'Wind-down check-in around 8pm',                  icon: '🌙' },
  { id: 'weekly_report',   label: 'Weekly Brain Report', desc: 'Your mood and activity summary every Sunday',    icon: '📊' },
]

const DEFAULTS: Prefs = {
  morning_checkin: true,
  focus_reminder:  true,
  med_reminder:    false,
  evening_checkin: false,
  weekly_report:   true,
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function NotificationsPage() {
  const [prefs,        setPrefs]        = useState<Prefs>(DEFAULTS)
  const [permission,   setPermission]   = useState<NotificationPermission | 'unsupported'>('default')
  const [enabling,     setEnabling]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  // Load prefs from server + check current permission
  useEffect(() => {
    if (!('Notification' in window)) { setPermission('unsupported'); return }
    setPermission(Notification.permission)

    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(data => setPrefs(prev => ({ ...prev, ...data })))
      .catch(() => {})
  }, [])

  async function handleEnablePush() {
    setEnabling(true)
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
      }
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        })
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.toJSON().keys }),
        })
      }
    } catch { /* ignore */ }
    setEnabling(false)
  }

  async function toggle(id: keyof Prefs) {
    const updated = { ...prefs, [id]: !prefs[id] }
    setPrefs(updated)
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const pushGranted = permission === 'granted'
  const pushDenied  = permission === 'denied'

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>
      <MeHeader title="Notifications" />

      <div className="lumi-me-content" style={{ paddingTop: 20 }}>

        {/* ── Push permission state ── */}
        {!pushGranted && permission !== 'unsupported' && (
          <div style={{
            background: pushDenied ? 'rgba(45,42,62,0.05)' : 'linear-gradient(135deg, rgba(244,165,130,0.12), rgba(245,201,138,0.10))',
            borderRadius: 16,
            border: `1px solid ${pushDenied ? 'rgba(45,42,62,0.08)' : 'rgba(244,165,130,0.28)'}`,
            padding: '16px 16px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px',
              fontWeight: 600,
              color: pushDenied ? '#9895B0' : '#2D2A3E',
              lineHeight: 1.5,
            }}>
              {pushDenied
                ? 'Notifications are blocked. Enable them in your browser or device settings.'
                : 'Allow notifications so Lumi can check in on you — even when the app is closed.'}
            </p>
            {!pushDenied && (
              <button
                onClick={handleEnablePush}
                disabled={enabling}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                  border: 'none',
                  cursor: enabling ? 'default' : 'pointer',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1E1C2E',
                }}
              >
                {enabling ? 'Enabling…' : 'Turn on notifications'}
              </button>
            )}
          </div>
        )}

        {/* ── Toggles ── */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px', fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8, paddingLeft: 4,
        }}>
          LUMI NUDGES
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 20,
          opacity: pushGranted ? 1 : 0.45,
          pointerEvents: pushGranted ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}>
          {TOGGLES.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < TOGGLES.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
              gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px', fontWeight: 700,
                  color: '#2D2A3E', marginBottom: 1,
                }}>
                  {t.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px', fontWeight: 600,
                  color: '#9895B0',
                }}>
                  {t.desc}
                </p>
              </div>
              <button
                onClick={() => toggle(t.id)}
                style={{
                  width: 44, height: 26, borderRadius: 13,
                  background: prefs[t.id]
                    ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
                    : 'rgba(45,42,62,0.12)',
                  border: 'none', cursor: 'pointer',
                  position: 'relative', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: prefs[t.id] ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>

        {/* Save feedback */}
        {(saving || saved) && (
          <p style={{
            textAlign: 'center',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px', fontWeight: 600,
            color: saved ? '#F4A582' : '#9895B0',
            marginBottom: 12,
            transition: 'color 0.2s',
          }}>
            {saved ? 'Saved ✓' : 'Saving…'}
          </p>
        )}

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Lumi never spams. Every nudge is optional.{'\n'}You can change this anytime.
        </p>

      </div>
    </div>
  )
}
