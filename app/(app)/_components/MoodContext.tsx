'use client'

import { createContext, useContext, useState } from 'react'

type MoodContextType = {
  mood: string | null
  setMood: (mood: string | null) => void
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
  const [mood, setMood] = useState<string | null>(null)
  const [lowBatteryDismissed, setLowBatteryDismissed] = useState(false)

  function handleSetMood(m: string | null) {
    setMood(m)
    if (m !== 'drained') setLowBatteryDismissed(false)
  }

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
