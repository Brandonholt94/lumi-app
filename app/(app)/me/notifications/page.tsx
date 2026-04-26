'use client'

import { useState, useEffect } from 'react'
import MeHeader from '../_components/MeHeader'

type Prefs = {
  morning_checkin: boolean
  focus_reminder:  boolean
  med_reminder:    boolean
  evening_checkin: boolean
  weekly_report:   boolean
  habit_reminder:  boolean
  morning_hour:    number
  evening_hour:    number
}

const DEFAULTS: Prefs = {
  morning_checkin: true,
  focus_reminder:  true,
  med_reminder:    false,
  evening_checkin: true,
  weekly_report:   true,
  habit_reminder:  false,
  morning_hour:    8,
  evening_hour:    19,
}

type Toggle = {
  id:       keyof Pick<Prefs, 'morning_checkin' | 'focus_reminder' | 'med_reminder' | 'evening_checkin' | 'weekly_report' | 'habit_reminder'>
  label:    string
  desc:     string
  icon:     string
  timeKey?: 'morning_hour' | 'evening_hour'
}

const TOGGLES: Toggle[] = [
  { id: 'morning_checkin', label: 'Morning check-in',    icon: '🌅', desc: 'Lumi says good morning',                        timeKey: 'morning_hour' },
  { id: 'focus_reminder',  label: 'Focus reminders',     icon: '🎯', desc: 'Gentle nudge when you have tasks waiting'       },
  { id: 'habit_reminder',  label: 'Habit reminders',     icon: '🌿', desc: 'Reminder if habits aren\'t logged by 6pm'      },
  { id: 'med_reminder',    label: 'Medication reminders',icon: '💊', desc: 'Based on your medication schedule'              },
  { id: 'evening_checkin', label: 'Evening reflection',  icon: '🌙', desc: 'Wind-down check-in',                           timeKey: 'evening_hour' },
  { id: 'weekly_report',   label: 'Weekly Brain Report', icon: '📊', desc: 'Mood and activity summary every Sunday at 9am' },
]

function fmt12h(hour: number): string {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'am' : 'pm'
  return `${h}:00 ${ampm}`
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function NotificationsPage() {
  const [prefs,      setPrefs]      = useState<Prefs>(DEFAULTS)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [enabling,   setEnabling]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [testSent,   setTestSent]   = useState(false)
  const [testError,  setTestError]  = useState<string | null>(null)

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

  async function save(updated: Prefs) {
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

  function toggle(id: keyof Prefs) {
    save({ ...prefs, [id]: !prefs[id as keyof Prefs] })
  }

  function setHour(key: 'morning_hour' | 'evening_hour', value: number) {
    save({ ...prefs, [key]: value })
  }

  async function sendTestPush() {
    setTesting(true)
    setTestSent(false)
    setTestError(null)
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        setTestSent(true)
        setTimeout(() => setTestSent(false), 4000)
      } else {
        setTestError(d.error ?? 'No subscription found — try re-enabling notifications.')
        setTimeout(() => setTestError(null), 5000)
      }
    } catch {
      setTestError('Something went wrong.')
      setTimeout(() => setTestError(null), 5000)
    }
    setTesting(false)
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
            background:   pushDenied ? 'rgba(45,42,62,0.05)' : 'linear-gradient(135deg, rgba(244,165,130,0.12), rgba(245,201,138,0.10))',
            borderRadius: 16,
            border:       `1px solid ${pushDenied ? 'rgba(45,42,62,0.08)' : 'rgba(244,165,130,0.28)'}`,
            padding:      '16px',
            marginBottom: 20,
            display:      'flex',
            flexDirection: 'column',
            gap:          10,
          }}>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600, color: pushDenied ? '#9895B0' : '#2D2A3E', lineHeight: 1.5 }}>
              {pushDenied
                ? 'Notifications are blocked. Enable them in your browser or device settings.'
                : 'Allow notifications so Lumi can check in on you — even when the app is closed.'}
            </p>
            {!pushDenied && (
              <button
                onClick={handleEnablePush}
                disabled={enabling}
                style={{
                  alignSelf:   'flex-start',
                  padding:     '8px 18px',
                  borderRadius: 20,
                  background:  'linear-gradient(135deg, #F4A582, #F5C98A)',
                  border:      'none',
                  cursor:      enabling ? 'default' : 'pointer',
                  fontFamily:  'var(--font-nunito-sans)',
                  fontSize:    '13px',
                  fontWeight:  700,
                  color:       '#1E1C2E',
                }}
              >
                {enabling ? 'Enabling…' : 'Turn on notifications'}
              </button>
            )}
          </div>
        )}

        {/* ── Toggles ── */}
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#9895B0', marginBottom: 8, paddingLeft: 4 }}>
          LUMI NUDGES
        </p>

        <div style={{
          background:    'white',
          borderRadius:  16,
          border:        '1px solid rgba(45,42,62,0.07)',
          overflow:      'hidden',
          marginBottom:  20,
          opacity:       pushGranted ? 1 : 0.45,
          pointerEvents: pushGranted ? 'auto' : 'none',
          transition:    'opacity 0.2s',
        }}>
          {TOGGLES.map((t, i) => (
            <div key={t.id}>
              {/* Toggle row */}
              <div style={{
                display:     'flex',
                alignItems:  'center',
                padding:     '14px 16px',
                borderBottom: (i < TOGGLES.length - 1 && !t.timeKey) || (t.timeKey && prefs[t.id as keyof Prefs])
                  ? '1px solid rgba(45,42,62,0.06)'
                  : 'none',
                gap: 12,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700, color: '#2D2A3E', marginBottom: 1 }}>
                    {t.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: '#9895B0' }}>
                    {t.timeKey && prefs[t.id as keyof Prefs]
                      ? `${t.desc} at ${fmt12h(prefs[t.timeKey])}`
                      : t.desc}
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(t.id)}
                  style={{
                    width: 44, height: 26, borderRadius: 13,
                    background: prefs[t.id as keyof Prefs]
                      ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
                      : 'rgba(45,42,62,0.12)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: prefs[t.id as keyof Prefs] ? 21 : 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Time picker — shown when toggle is on and timeKey is set */}
              {t.timeKey && prefs[t.id as keyof Prefs] && (
                <div style={{
                  padding:      '10px 16px 14px',
                  borderBottom: i < TOGGLES.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  paddingLeft:  52, // align with label text
                }}>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#9895B0', flexShrink: 0 }}>
                    Send at
                  </p>
                  <select
                    value={prefs[t.timeKey]}
                    onChange={e => setHour(t.timeKey!, parseInt(e.target.value))}
                    style={{
                      fontFamily:   'var(--font-nunito-sans)',
                      fontSize:     '13px',
                      fontWeight:   700,
                      color:        '#2D2A3E',
                      background:   'rgba(45,42,62,0.05)',
                      border:       '1px solid rgba(45,42,62,0.10)',
                      borderRadius: 8,
                      padding:      '5px 10px',
                      cursor:       'pointer',
                      outline:      'none',
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{fmt12h(h)}</option>
                    ))}
                  </select>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#C4C1D4' }}>
                    your local time
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save feedback */}
        {(saving || saved) && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: saved ? '#F4A582' : '#9895B0', marginBottom: 12, transition: 'color 0.2s' }}>
            {saved ? 'Saved ✓' : 'Saving…'}
          </p>
        )}

        {/* Test push notification */}
        {pushGranted && (
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <button
              onClick={sendTestPush}
              disabled={testing}
              style={{
                background:   testSent ? 'rgba(94,194,105,0.12)' : 'rgba(45,42,62,0.06)',
                border:       `1px solid ${testSent ? 'rgba(94,194,105,0.25)' : 'rgba(45,42,62,0.09)'}`,
                borderRadius: 12,
                padding:      '10px 20px',
                cursor:       testing ? 'default' : 'pointer',
                fontFamily:   'var(--font-nunito-sans)',
                fontSize:     '13px',
                fontWeight:   700,
                color:        testSent ? '#4A9A55' : '#9895B0',
                transition:   'all 0.2s',
              }}
            >
              {testing ? 'Sending…' : testSent ? '✓ Check your notifications!' : 'Send a test notification'}
            </button>
            {testError && (
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 600, color: '#C84040', marginTop: 8 }}>
                {testError}
              </p>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600, color: 'rgba(45,42,62,0.3)', lineHeight: 1.5 }}>
          Lumi never spams. Every nudge is optional.{'\n'}You can change this anytime.
        </p>

      </div>
    </div>
  )
}
