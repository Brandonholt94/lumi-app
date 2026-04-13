'use client'

import { useState, useEffect, useCallback } from 'react'

type Medication = {
  id: string
  name: string
  dose: string | null
  time_of_day: string
}

// Which time-of-day slots are active at a given hour
function getActiveSlots(hour: number): string[] {
  const slots: string[] = []
  if (hour >= 5  && hour < 12) slots.push('Morning')
  if (hour >= 11 && hour < 14) slots.push('Midday')
  if (hour >= 13 && hour < 18) slots.push('Afternoon')
  if (hour >= 17 && hour < 22) slots.push('Evening')
  if (hour >= 20)              slots.push('Bedtime')
  return slots
}

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function MedCheckIn() {
  const [meds, setMeds]         = useState<Medication[]>([])
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set())
  const [slots, setSlots]       = useState<string[]>([])
  const [visible, setVisible]   = useState(false)
  const [allDone, setAllDone]   = useState(false)

  const load = useCallback(async () => {
    const hour = new Date().getHours()
    const activeSlots = getActiveSlots(hour)
    setSlots(activeSlots)
    if (activeSlots.length === 0) return

    const [medsRes, logRes] = await Promise.all([
      fetch('/api/medications'),
      fetch(`/api/medications/log?date=${todayDate()}`),
    ])
    if (!medsRes.ok || !logRes.ok) return

    const allMeds: Medication[] = await medsRes.json()
    const taken: string[]       = await logRes.json()
    const takenSet              = new Set(taken)

    // Only show meds for active time slots
    const dueMeds = allMeds.filter(m => activeSlots.includes(m.time_of_day))
    if (dueMeds.length === 0) return

    setMeds(dueMeds)
    setTakenIds(takenSet)

    const allChecked = dueMeds.every(m => takenSet.has(m.id))
    if (allChecked) {
      // All already taken — show briefly then hide
      setAllDone(true)
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    } else {
      setVisible(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggle(id: string) {
    const taken = !takenIds.has(id)
    const next = new Set(takenIds)
    taken ? next.add(id) : next.delete(id)
    setTakenIds(next)

    await fetch('/api/medications/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: id, date: todayDate(), taken }),
    })

    // If all checked after this toggle, show done state then fade out
    if (taken && meds.every(m => m.id === id ? true : next.has(m.id))) {
      setAllDone(true)
      setTimeout(() => setVisible(false), 2500)
    }
  }

  if (!visible || meds.length === 0) return null

  const slotLabel = slots.length === 1 ? slots[0] : slots[0]

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid rgba(45,42,62,0.07)',
      boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: allDone ? 'none' : '1px solid rgba(45,42,62,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="1" width="6" height="3" rx="1" stroke="#F4A582" strokeWidth="1.4"/>
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="#F4A582" strokeWidth="1.4"/>
          <path d="M8 7V9.5M6.5 8.5H9.5" stroke="#F4A582" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px',
          fontWeight: 800,
          color: '#2D2A3E',
          flex: 1,
        }}>
          {allDone ? 'Meds taken ✓' : `${slotLabel} meds`}
        </p>
        {allDone && (
          <span style={{ fontSize: 16 }}>🎉</span>
        )}
      </div>

      {/* Med checklist */}
      {!allDone && (
        <div>
          {meds.map((med, i) => {
            const taken = takenIds.has(med.id)
            return (
              <button
                key={med.id}
                onClick={() => toggle(med.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < meds.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                  background: 'none',
                  border: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottomColor: i < meds.length - 1 ? 'rgba(45,42,62,0.06)' : 'transparent',
                  borderBottomWidth: i < meds.length - 1 ? 1 : 0,
                  borderBottomStyle: 'solid',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: taken ? 'none' : '2px solid rgba(45,42,62,0.15)',
                  background: taken ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  {taken && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#1E1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: taken ? '#9895B0' : '#2D2A3E',
                    textDecoration: taken ? 'line-through' : 'none',
                  }}>
                    {med.name}
                  </p>
                  {med.dose && (
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#9895B0',
                    }}>
                      {med.dose}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
