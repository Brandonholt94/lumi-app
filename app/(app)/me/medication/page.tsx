'use client'

import { useState } from 'react'
import MeHeader from '../_components/MeHeader'

type Medication = {
  id: string
  name: string
  dose: string
  time: string
  taken: boolean
}

const TIMES = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Bedtime']

export default function MedicationPage() {
  const [meds, setMeds] = useState<Medication[]>([
    { id: '1', name: 'Adderall XR', dose: '20mg', time: 'Morning', taken: false },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDose, setNewDose] = useState('')
  const [newTime, setNewTime] = useState('Morning')

  function toggleTaken(id: string) {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m))
  }

  function addMed() {
    if (!newName.trim()) return
    setMeds(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      dose: newDose.trim(),
      time: newTime,
      taken: false,
    }])
    setNewName('')
    setNewDose('')
    setNewTime('Morning')
    setShowAdd(false)
  }

  function removeMed(id: string) {
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  const takenCount = meds.filter(m => m.taken).length

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Medication log" />

      {/* Today summary */}
      {meds.length > 0 && (
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
              {takenCount === meds.length && meds.length > 0
                ? 'All done for today!'
                : `${takenCount} of ${meds.length} taken today`}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pt-2">

        {/* Section label */}
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

        {/* Meds list */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {meds.length === 0 ? (
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
            meds.map((med, i) => (
              <div key={med.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < meds.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                gap: 12,
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => toggleTaken(med.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: med.taken ? 'none' : '2px solid rgba(45,42,62,0.15)',
                    background: med.taken ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {med.taken && (
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
                    color: med.taken ? '#9895B0' : '#2D2A3E',
                    textDecoration: med.taken ? 'line-through' : 'none',
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
                    {med.dose && `${med.dose} · `}{med.time}
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
            ))
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
                TIME OF DAY
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewTime(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 100,
                      border: '1px solid',
                      borderColor: newTime === t ? '#F4A582' : 'rgba(45,42,62,0.12)',
                      background: newTime === t ? 'linear-gradient(135deg, rgba(244,165,130,0.15), rgba(245,201,138,0.15))' : 'transparent',
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: newTime === t ? '#2D2A3E' : '#9895B0',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
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
                disabled={!newName.trim()}
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
                Add
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
