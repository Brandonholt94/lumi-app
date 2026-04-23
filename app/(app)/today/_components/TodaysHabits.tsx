'use client'

import { useState, useEffect } from 'react'

interface Habit {
  id: string
  name: string
  emoji: string
  position: number
  done: boolean
}

// ── Setup card ─────────────────────────────────────────────────
function HabitSetup({ onAdded }: { onAdded: (habit: Habit) => void }) {
  const [open, setOpen]     = useState(false)
  const [name, setName]     = useState('')
  const [emoji, setEmoji]   = useState('')
  const [saving, setSaving] = useState(false)

  const EMOJI_SUGGESTIONS = ['💧', '🚶', '📖', '🧘', '🍎', '✍️', '😴', '🌿', '💊', '☀️']

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const res  = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), emoji: emoji || '✦' }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.habit) {
      onAdded(data.habit)
      setName('')
      setEmoji('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          background: 'rgba(244,165,130,0.06)',
          border: '1.5px dashed rgba(244,165,130,0.28)',
          borderRadius: 14,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          marginBottom: 6,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(244,165,130,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5v9M2.5 7h9" stroke="#F4A582" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px',
          fontWeight: 700,
          color: '#C86040',
        }}>
          Add a habit
        </span>
      </button>
    )
  }

  return (
    <div style={{
      background: 'white',
      border: '1.5px solid rgba(244,165,130,0.30)',
      borderRadius: 14,
      padding: '14px',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="✦"
          maxLength={2}
          style={{
            width: 44,
            padding: '10px',
            textAlign: 'center',
            fontSize: '18px',
            background: '#FBF8F5',
            border: '1.5px solid rgba(45,42,62,0.10)',
            borderRadius: 10,
            outline: 'none',
            flexShrink: 0,
          }}
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) save() }}
          placeholder="e.g. Drink water"
          autoFocus
          style={{
            flex: 1,
            padding: '10px 13px',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1E1C2E',
            background: '#FBF8F5',
            border: '1.5px solid rgba(45,42,62,0.10)',
            borderRadius: 10,
            outline: 'none',
          }}
        />
      </div>

      {/* Quick emoji picker */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {EMOJI_SUGGESTIONS.map(e => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            style={{
              fontSize: '16px',
              width: 32, height: 32,
              borderRadius: 8,
              background: emoji === e ? 'rgba(244,165,130,0.18)' : 'rgba(45,42,62,0.05)',
              border: emoji === e ? '1.5px solid rgba(244,165,130,0.40)' : '1.5px solid transparent',
              cursor: 'pointer',
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setOpen(false)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            background: 'rgba(45,42,62,0.06)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#9895B0',
          }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: 10,
            background: name.trim()
              ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
              : 'rgba(45,42,62,0.08)',
            border: 'none',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 800,
            color: name.trim() ? '#1E1C2E' : '#9895B0',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Add habit'}
        </button>
      </div>
    </div>
  )
}

// ── Habit row ──────────────────────────────────────────────────
function HabitRow({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit
  onToggle: () => void
  onDelete: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
      }}
    >
      {/* Tap emoji/checkbox to toggle */}
      <button
        onClick={onToggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          flexShrink: 0,
          border: habit.done ? 'none' : '1.8px solid rgba(45,42,62,0.12)',
          background: habit.done
            ? 'linear-gradient(135deg, #F4A582, #E8A0BF)'
            : 'rgba(45,42,62,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
          fontSize: habit.done ? '0px' : '16px',
        }}
      >
        {habit.done ? (
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <span style={{ fontSize: '16px' }}>{habit.emoji}</span>
        )}
      </button>

      {/* Name */}
      <span
        onClick={onToggle}
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '14px',
          fontWeight: 600,
          color: habit.done ? '#9895B0' : '#1E1C2E',
          textDecoration: habit.done ? 'line-through' : 'none',
          flex: 1,
          cursor: 'pointer',
          transition: 'color 0.18s',
        }}
      >
        {habit.name}
      </span>

      {/* Long-press / hold to delete — tap to toggle */}
      <button
        onClick={() => setShowDelete(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'rgba(45,42,62,0.25)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      {/* Confirm delete */}
      {showDelete && (
        <button
          onClick={() => { setShowDelete(false); onDelete() }}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(200,64,64,0.10)',
            border: '1px solid rgba(200,64,64,0.22)',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px',
            fontWeight: 800,
            color: '#C84040',
            flexShrink: 0,
          }}
        >
          Remove
        </button>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function TodaysHabits() {
  const [habits, setHabits] = useState<Habit[] | null>(null)

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => setHabits(d.habits ?? []))
  }, [])

  if (habits === null) return null

  async function toggle(habit: Habit) {
    const newDone = !habit.done
    setHabits(prev => prev!.map(h => h.id === habit.id ? { ...h, done: newDone } : h))
    await fetch('/api/habits/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId: habit.id, done: newDone }),
    })
  }

  async function deleteHabit(id: string) {
    setHabits(prev => prev!.filter(h => h.id !== id))
    await fetch(`/api/habits?id=${id}`, { method: 'DELETE' })
  }

  function onAdded(habit: Habit) {
    setHabits(prev => [...(prev ?? []), habit])
  }

  return (
    <>
      <p
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 9,
        }}
      >
        TODAY&apos;S HABITS
      </p>

      <div
        style={{
          background: 'white',
          borderRadius: 18,
          border: '1px solid rgba(45,42,62,0.07)',
          boxShadow: '0 2px 8px rgba(45,42,62,0.05)',
          padding: '4px 16px 6px',
          marginBottom: 20,
        }}
      >
        {habits.length === 0 ? (
          <div style={{ padding: '12px 0 8px', textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#9895B0',
              marginBottom: 12,
              lineHeight: 1.5,
            }}>
              Small things. No streaks. Just checking in.
            </p>
            <HabitSetup onAdded={onAdded} />
          </div>
        ) : (
          <>
            {habits.map((habit, i) => (
              <div key={habit.id}>
                <HabitRow
                  habit={habit}
                  onToggle={() => toggle(habit)}
                  onDelete={() => deleteHabit(habit.id)}
                />
                {i < habits.length - 1 && (
                  <div style={{ height: 1, background: 'rgba(45,42,62,0.05)', margin: '0 2px' }} />
                )}
              </div>
            ))}
            {habits.length < 3 && (
              <>
                <div style={{ height: 1, background: 'rgba(45,42,62,0.05)', margin: '0 2px' }} />
                <div style={{ padding: '10px 0 6px' }}>
                  <HabitSetup onAdded={onAdded} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
