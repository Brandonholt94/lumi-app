'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MeHeader from '../_components/MeHeader'

const PEACH  = '#F4A582'
const GOLD   = '#F5C98A'
const DARKER = '#1E1C2E'
const MUTED  = '#9895B0'

export default function AnchorsPage() {
  const router = useRouter()
  const [inputs,  setInputs]  = useState(['', '', ''])
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  // Load existing anchors
  useEffect(() => {
    fetch('/api/morning-anchors')
      .then(r => r.json())
      .then(data => {
        if (data?.anchors?.length > 0) {
          // Pre-fill existing anchors, pad to 3 slots
          const filled = [...data.anchors, '', '', ''].slice(0, 3)
          setInputs(filled)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    const filled = inputs.map(s => s.trim()).filter(Boolean)
    if (!filled.length) return
    setSaving(true)
    setSaved(false)
    await fetch('/api/morning-anchors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ anchors: filled }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => router.back(), 800)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>
      <MeHeader title="Morning Anchors" />

      <div className="lumi-me-content" style={{ paddingTop: 20, paddingBottom: 48 }}>

        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px', fontWeight: 500,
          color: MUTED, lineHeight: 1.6,
          marginBottom: 24,
        }}>
          3 small things that start your day right. Keep them simple — things you already do or want to do.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 48, borderRadius: 12, background: 'rgba(45,42,62,0.06)' }} />
            ))}
          </div>
        ) : (
          <>
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
                  padding: '13px 16px',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: DARKER,
                  background: 'white',
                  border: '1.5px solid rgba(45,42,62,0.10)',
                  borderRadius: 13,
                  outline: 'none',
                }}
              />
            ))}

            <button
              onClick={save}
              disabled={saving || inputs.every(s => !s.trim())}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: saved
                  ? 'rgba(94,194,105,0.15)'
                  : `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '15px',
                fontWeight: 800,
                color: saved ? '#3DA85A' : DARKER,
                cursor: saving || inputs.every(s => !s.trim()) ? 'not-allowed' : 'pointer',
                opacity: inputs.every(s => !s.trim()) ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save anchors'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
