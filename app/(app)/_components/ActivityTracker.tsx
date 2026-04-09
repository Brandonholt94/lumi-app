'use client'

import { useEffect } from 'react'

// Fires once on every app open — upserts last_seen_at to Supabase
// Powers re-entry detection: Lumi knows when someone comes back after being away
export default function ActivityTracker() {
  useEffect(() => {
    fetch('/api/activity', { method: 'POST' }).catch(() => {
      // Silently fail — never break the app over analytics
    })
  }, [])

  return null
}
