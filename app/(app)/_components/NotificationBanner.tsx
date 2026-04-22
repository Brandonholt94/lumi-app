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
    // Only show if push is supported and not yet granted
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission === 'granted') return

    // Slight delay so it doesn't flash on first render
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  async function handleEnable() {
    setLoading(true)

    // Register service worker if not already
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await subscribeToPush()
      setShow(false)
    } else {
      setShow(false)
    }

    setLoading(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        background: '#2D2A3E',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        zIndex: 60,
      }}
    >
      {/* Bell icon */}
      <svg width="16" height="16" viewBox="0 0 256 256" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.63-16h45.26A24,24,0,0,1,128,216Z"
          fill="#F4A582"
        />
      </svg>

      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'white',
        flex: 1,
        lineHeight: 1.3,
      }}>
        Get nudges from Lumi —{' '}
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 700,
            color: '#F4A582',
            textDecoration: 'underline',
          }}
        >
          {loading ? 'Enabling…' : 'Turn on notifications'}
        </button>
      </p>

      {/* Dismiss */}
      <button
        onClick={() => setShow(false)}
        style={{
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          flexShrink: 0,
          color: 'rgba(255,255,255,0.45)',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
