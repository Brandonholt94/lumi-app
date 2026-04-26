'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnchorState {
  anchors: string[]
  checked: number[]
}

// ── Setup card shown when anchors not configured ───────────────
function AnchorSetup({ onSaved }: { onSaved: (anchors: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [inputs, setInputs] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)

  async function save() {
    const filled = inputs.map(s => s.trim()).filter(Boolean)
    if (!filled.length) return
    setSaving(true)
    await fetch('/api/morning-anchors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anchors: filled }),
    })
    setSaving(false)
    onSaved(filled)
    setOpen(false)
  }

  if (!open) {
    return (
      <div
        style={{
          background: 'white',
          border: '1.5px dashed rgba(245,201,138,0.50)',
          borderRadius: 18,
          padding: '18px 18px 16px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 8 }}>🌅</div>
        <p style={{
          fontFamily: 'var(--font-aegora)',
          fontSize: '15px',
          fontWeight: 500,
          color: '#1E1C2E',
          marginBottom: 4,
        }}>
          Set your morning anchors
        </p>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 500,
          color: '#9895B0',
          marginBottom: 14,
          lineHeight: 1.5,
        }}>
          3 small things that start your day right.<br />Lumi checks them off with you each morning.
        </p>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #F5C98A, #F4A582)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 22px',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: '#1E1C2E',
            cursor: 'pointer',
          }}
        >
          Set up anchors →
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1.5px solid rgba(245,201,138,0.40)',
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 20,
      }}
    >
      <p style={{
        fontFamily: 'var(--font-aegora)',
        fontSize: '15px',
        fontWeight: 500,
        color: '#1E1C2E',
        marginBottom: 4,
      }}>
        Your 3 morning anchors
      </p>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '12px',
        fontWeight: 500,
        color: '#9895B0',
        marginBottom: 14,
      }}>
        Keep them simple — things you already do or want to do.
      </p>
      {inputs.map((val, i) => (
        <input
          key={i}
          value={val}
          onChange={e => setInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
          placeholder={['e.g. Drink a glass of water', 'e.g. Take your meds', 'e.g. Open Lumi'][i]}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: 10,
            padding: '11px 14px',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1E1C2E',
            background: '#FBF8F5',
            border: '1.5px solid rgba(45,42,62,0.10)',
            borderRadius: 11,
            outline: 'none',
          }}
        />
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={() => setOpen(false)}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: 11,
            background: 'rgba(45,42,62,0.06)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 700,
            color: '#9895B0',
          }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{
            flex: 2,
            padding: '11px',
            borderRadius: 11,
            background: 'linear-gradient(135deg, #F5C98A, #F4A582)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: '#1E1C2E',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save anchors'}
        </button>
      </div>
    </div>
  )
}

// ── Anchor row ─────────────────────────────────────────────────
function AnchorRow({
  text,
  done,
  onToggle,
}: {
  text: string
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '9px 0',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        flexShrink: 0,
        border: done ? 'none' : '1.8px solid rgba(245,201,138,0.60)',
        background: done
          ? 'linear-gradient(135deg, #F5C98A, #F4A582)'
          : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.18s ease',
      }}>
        {done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 600,
        color: done ? '#9895B0' : '#1E1C2E',
        textDecoration: done ? 'line-through' : 'none',
        transition: 'color 0.18s, text-decoration 0.18s',
        flex: 1,
        lineHeight: 1.3,
      }}>
        {text}
      </span>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function MorningAnchors() {
  const [state, setState] = useState<AnchorState | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/morning-anchors')
      .then(r => r.json())
      .then(setState)
  }, [])

  // Only show setup card — configured anchors are now shown inside DayTimeline
  if (!state || state.anchors.length > 0) return null

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
        MORNING ANCHORS
      </p>
      <AnchorSetup
        onSaved={anchors => {
          setState({ anchors, checked: [] })
          router.refresh()
        }}
      />
    </>
  )
}
