'use client'

import { useEffect, useState } from 'react'

// Registers the service worker and subscribes to push notifications
async function subscribeToPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.toJSON().keys }),
    })

    return true
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function NotificationBanner() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    if (Notification.permission === 'granted') {
      // Permission already granted (e.g. from PWA install prompt or prior session).
      // Silently ensure the subscription is saved — the banner won't show but we
      // still need a row in push_subscriptions for crons to reach this device.
      navigator.serviceWorker.register('/sw.js')
        .then(() => subscribeToPush())
        .catch(() => {})
      return
    }

    if (Notification.permission === 'denied') return

    // 'default' — show the opt-in banner after a short delay
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  async function handleEnable() {
    setLoading(true)
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await subscribeToPush()
    }
    setShow(false)
    setLoading(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(90deg, #6B5FA8 0%, #8A6FB5 40%, #C47BA0 80%, #F4A582 100%)',
        padding: '9px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexShrink: 0,
        position: 'relative',
        zIndex: 60,
      }}
    >
      {/* Bell icon */}
      <svg width="15" height="15" viewBox="0 0 256 256" fill="none" style={{ flexShrink: 0, opacity: 0.9 }}>
        <path
          d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.63-16h45.26A24,24,0,0,1,128,216Z"
          fill="white"
        />
      </svg>

      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.95)',
        lineHeight: 1.3,
        margin: 0,
      }}>
        Never miss a nudge from Lumi —{' '}
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: 'white',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}
        >
          {loading ? 'Enabling…' : 'Turn on notifications'}
        </button>
      </p>

      {/* Dismiss */}
      <button
        onClick={() => setShow(false)}
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.65)',
          display: 'flex',
          alignItems: 'center',
          lineHeight: 0,
        }}
        aria-label="Dismiss"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
