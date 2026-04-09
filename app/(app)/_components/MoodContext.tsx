'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Mood = 'foggy' | 'okay' | 'wired' | 'drained' | null

type MoodContextType = {
  mood: Mood
  setMood: (mood: Mood) => void
  lowBatteryDismissed: boolean
  dismissLowBattery: () => void
}

const MoodContext = createContext<MoodContextType>({
  mood: null,
  setMood: () => {},
  lowBatteryDismissed: false,
  dismissLowBattery: () => {},
})

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<Mood>(null)
  const [lowBatteryDismissed, setLowBatteryDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // On mount — hydrate mood from today's Supabase record
  // This means if they set mood this morning and return tonight, Lumi remembers
  useEffect(() => {
    async function hydrateMood() {
      try {
        const res = await fetch('/api/mood')
        const data = await res.json()
        if (data.mood) {
          setMoodState(data.mood as Mood)
        }
      } catch {
        // Silently fail — mood just stays null, no broken experience
      } finally {
        setHydrated(true)
      }
    }
    hydrateMood()
  }, [])

  async function handleSetMood(m: Mood) {
    setMoodState(m)
    if (m !== 'drained') setLowBatteryDismissed(false)

    // Persist to Supabase — fire and forget, never block the UI
    if (m) {
      fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: m }),
      }).catch(() => {
        // Silently fail — mood is still set in state, experience is unaffected
      })
    }
  }

  // Suppress rendering until hydration resolves to avoid mood flicker
  // (e.g. Today page briefly showing no mood selected when they already set one)
  if (!hydrated) return null

  return (
    <MoodContext.Provider value={{
      mood,
      setMood: handleSetMood,
      lowBatteryDismissed,
      dismissLowBattery: () => setLowBatteryDismissed(true),
    }}>
      {children}
    </MoodContext.Provider>
  )
}

export const useMood = () => useContext(MoodContext)
