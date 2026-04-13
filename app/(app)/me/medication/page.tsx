'use client'

import { useState, useEffect, useCallback } from 'react'
import MeHeader from '../_components/MeHeader'

type Medication = {
  id: string
  name: string
  dose: string | null
  scheduled_time: string // "HH:MM:SS" from postgres time type
}

function formatTime(t: string) {
  // t is "HH:MM:SS" or "HH:MM"
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function MedicationPage() {
  const [meds, setMeds]         = useState<Medication[]>([])
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newDose, setNewDose]   = useState('')
  const [newTime, setNewTime]   = useState('08:00')
  const [saving, setSaving]     = useState(false)

  const fetchMeds = useCallback(async () => {
    const [medsRes, logRes] = await Promise.all([
      fetch('/api/medications'),
      fetch(`/api/medications/log?date=${todayDate()}`),
    ])
    if (medsRes.ok) setMeds(await medsRes.json())
    if (logRes.ok) setTakenIds(new Set(await logRes.json()))
    setLoading(false)
  }, [])

  useEffect(() => { fetchMeds() }, [fetchMeds])

  async function toggleTaken(id: string) {
    const taken = !takenIds.has(id)
    setTakenIds(prev => {
      const next = new Set(prev)
      taken ? next.add(id) : next.delete(id)
      return next
    })
    await fetch('/api/medications/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: id, date: todayDate(), taken }),
    })
  }

  async function addMed() {
    if (!newName.trim() || saving) return
    setSaving(true)
    const res = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), dose: newDose.trim(), scheduled_time: newTime }),
    })
    if (res.ok) {
      const med = await res.json()
      setMeds(prev => [...prev, med])
    }
    setNewName('')
    setNewDose('')
    setNewTime('08:00')
    setShowAdd(false)
    setSaving(false)
  }

  async function removeMed(id: string) {
    setMeds(prev => prev.filter(m => m.id !== id))
    await fetch(`/api/medications?id=${id}`, { method: 'DELETE' })
  }

  const takenCount = meds.filter(m => takenIds.has(m.id)).length

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Medication log" />

      {!loading && meds.length > 0 && (
        <div className="px-5 py-3">
          <div style={{
            background: takenCount === meds.length
              ? 'linear-gradient(135deg, rgba(244,165,130,0.15), rgba(245,201,138,0.15))'
              : 'rgba(45,42,62,0.04)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{takenCount === meds.length ? '🎉' : '💊'}</span>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#2D2A3E',
            }}>
              {takenCount === meds.length
                ? 'All done for today!'
                : `${takenCount} of ${meds.length} taken today`}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pt-2">

        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          TODAY
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {loading ? (
            <div style={{ padding: '20px 16px' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: i === 1 ? 14 : 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#F0EDE8' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 10, width: '55%', borderRadius: 4, background: '#F0EDE8', marginBottom: 6 }} />
                    <div style={{ height: 8, width: '35%', borderRadius: 4, background: '#F0EDE8' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : meds.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#9895B0',
              }}>
                No medications yet. Add one below.
              </p>
            </div>
          ) : (
            meds.map((med, i) => {
              const taken = takenIds.has(med.id)
              return (
                <div key={med.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: i < meds.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                  gap: 12,
                }}>
                  <button
                    onClick={() => toggleTaken(med.id)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: taken ? 'none' : '2px solid rgba(45,42,62,0.15)',
                      background: taken ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {taken && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#1E1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: taken ? '#9895B0' : '#2D2A3E',
                      textDecoration: taken ? 'line-through' : 'none',
                      marginBottom: 1,
                    }}>
                      {med.name}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#9895B0',
                    }}>
                      {med.dose ? `${med.dose} · ` : ''}{formatTime(med.scheduled_time)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeMed(med.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: '#C4C0D4',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Add medication form */}
        {showAdd ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '16px',
            marginBottom: 16,
          }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px',
              fontWeight: 800,
              color: '#2D2A3E',
              marginBottom: 12,
            }}>
              Add medication
            </p>

            <input
              type="text"
              placeholder="Medication name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid rgba(45,42,62,0.12)',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#2D2A3E',
                marginBottom: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="text"
              placeholder="Dose (e.g. 20mg)"
              value={newDose}
              onChange={e => setNewDose(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid rgba(45,42,62,0.12)',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#2D2A3E',
                marginBottom: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ marginBottom: 14 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#9895B0',
                marginBottom: 6,
              }}>
                TIME
              </p>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(45,42,62,0.12)',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2D2A3E',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'white',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid rgba(45,42,62,0.12)',
                  background: 'transparent',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#9895B0',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={addMed}
                disabled={!newName.trim() || saving}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: newName.trim() ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.08)',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: newName.trim() ? '#1E1C2E' : '#9895B0',
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: '1.5px dashed rgba(45,42,62,0.15)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 700,
              color: '#9895B0',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add medication
          </button>
        )}

        <p style={{
          marginTop: 20,
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Lumi uses this to be aware of your medication routine.{'\n'}Not medical advice.
        </p>

      </div>
    </div>
  )
}
