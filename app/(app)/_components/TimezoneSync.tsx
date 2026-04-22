'use client'

import { useEffect } from 'react'

// Silently detects the browser timezone and saves it to the user's profile.
// Fires once per session — fast and non-blocking.
export default function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return
    fetch('/api/profile/timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    }).catch(() => {}) // fire and forget
  }, [])

  return null
}
