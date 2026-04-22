'use client'

import { useState, useEffect, useRef } from 'react'
import MeHeader from '../_components/MeHeader'

const NAMES: { value: string; label: string; example: string }[] = [
  { value: 'first_name', label: 'By first name',  example: '"Hey, Sarah!"' },
  { value: 'nickname',   label: 'Nickname',        example: 'You pick what I call you' },
  { value: 'friend',     label: 'Just "friend"',   example: '"Hey, friend!"' },
]

// Phosphor Bold icons for each vibe
function IconHeart({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill={color}>
      <path d="M240,94c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,220.66,16,164,16,94A62.07,62.07,0,0,1,78,32c20.65,0,38.73,8.88,50,23.89C139.27,40.88,157.35,32,178,32A62.07,62.07,0,0,1,240,94Z"/>
    </svg>
  )
}
function IconLightning({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill={color}>
      <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L40,144a8,8,0,0,1-5.08-14.31l112-96a8,8,0,0,1,13,9.09L140.13,112H216a8,8,0,0,1-2.15,13.46Z"/>
    </svg>
  )
}
function IconStar({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill={color}>
      <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-6.87,17.67,15.88,15.88,0,0,1-18.07.35L128,198.08,77.93,229.77a15.88,15.88,0,0,1-18.07-.35A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,27.09,98l58.59-7.6,23.43-54.72a15.93,15.93,0,0,1,29.56,0l23.43,54.72,58.59,7.6a16.46,16.46,0,0,1,13.6,16.85Z"/>
    </svg>
  )
}
function IconLeaf({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill={color}>
      <path d="M222.14,37.86a8,8,0,0,0-5.71-2.35C190.34,35.27,144.12,42.78,113.22,73.68L56,68.81A16.06,16.06,0,0,0,42.67,74L26,90.67A16,16,0,0,0,37.72,116.44l34.94,3.11a200.7,200.7,0,0,0-23.6,51.17A16,16,0,0,0,53.22,189.3l14.27,3.07,3.07,14.27a16,16,0,0,0,18.69,3.16,200.7,200.7,0,0,0,51.17-23.6l3.11,34.94A16,16,0,0,0,165.33,233l16.67-16.67A16.06,16.06,0,0,0,187.19,200l-4.87-57.22C213.22,111.88,220.73,65.66,220.49,39.57A8,8,0,0,0,222.14,37.86ZM48,104.75l13.34-13.34,42.75,3.8c-6.37,7.8-11.81,16-16.35,24.27ZM151.25,208l-14.48-16.26a179.7,179.7,0,0,0,24.27-16.35ZM176,143.49c-14.35,14.35-33.09,27.47-55.49,38.67A168.14,168.14,0,0,1,74.84,181,168.14,168.14,0,0,1,73.67,135c11.2-22.4,24.32-41.14,38.67-55.49C139.76,52,177.34,44.75,200.33,43.31,198.89,66.3,191.63,103.88,176,143.49Z"/>
    </svg>
  )
}

const STYLES: { value: string; label: string; desc: string; icon: (color: string) => React.ReactNode }[] = [
  { value: 'warm',    label: 'Warm & gentle',   desc: 'Soft, encouraging — like a close friend', icon: c => <IconHeart color={c} /> },
  { value: 'direct',  label: 'Direct & focused', desc: 'Gets to the point, no fluff',             icon: c => <IconLightning color={c} /> },
  { value: 'playful', label: 'Playful & light',  desc: 'A little humor, keeps it fun',            icon: c => <IconStar color={c} /> },
  { value: 'calm',    label: 'Calm & steady',    desc: 'Low-key, grounded, no pressure',          icon: c => <IconLeaf color={c} /> },
]

export default function LumiPreferencesPage() {
  const [nameStyle, setNameStyle] = useState('first_name')
  const [nickname,  setNickname]  = useState('')
  const [commStyle, setCommStyle] = useState('warm')
  const [saved,     setSaved]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const nicknameRef = useRef<HTMLInputElement>(null)

  // Auto-focus nickname input when it appears
  useEffect(() => {
    if (nameStyle === 'nickname') {
      setTimeout(() => nicknameRef.current?.focus(), 80)
    }
  }, [nameStyle])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone_preference: commStyle,
          display_name: nameStyle === 'nickname' ? nickname.trim() || undefined : undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>

      <MeHeader title="How Lumi addresses you" />

      <div style={{ padding: '24px 20px 0' }}>

        {/* ── What Lumi calls you ── */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px', fontWeight: 800,
          letterSpacing: '0.1em', color: '#9895B0',
          marginBottom: 10, paddingLeft: 2,
        }}>
          WHAT LUMI CALLS YOU
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          boxShadow: '0 2px 8px rgba(45,42,62,0.05)',
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          {NAMES.map((n, i) => (
            <div key={n.value}>
              {/* Option row */}
              <button
                onClick={() => setNameStyle(n.value)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: nameStyle === n.value ? 'rgba(244,165,130,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: (i < NAMES.length - 1 && !(nameStyle === 'nickname' && n.value === 'nickname'))
                    ? '1px solid rgba(45,42,62,0.06)'
                    : 'none',
                  cursor: 'pointer',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                {/* Radio dot */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: nameStyle === n.value ? 'none' : '2px solid rgba(45,42,62,0.15)',
                  background: nameStyle === n.value
                    ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
                    : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {nameStyle === n.value && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E1C2E' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '14px', fontWeight: 700,
                    color: '#1E1C2E', marginBottom: 1,
                  }}>
                    {n.label}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '12px', fontWeight: 500, color: '#9895B0',
                  }}>
                    {n.example}
                  </p>
                </div>
              </button>

              {/* Inline nickname input — expands right under the Nickname row */}
              {n.value === 'nickname' && nameStyle === 'nickname' && (
                <div style={{
                  padding: '0 16px 14px',
                  borderBottom: '1px solid rgba(45,42,62,0.06)',
                }}>
                  <input
                    ref={nicknameRef}
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="e.g. Bran, Chief, Boss…"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      boxSizing: 'border-box',
                      background: 'rgba(244,165,130,0.06)',
                      border: '1.5px solid rgba(244,165,130,0.30)',
                      borderRadius: 10,
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '14px', fontWeight: 600,
                      color: '#1E1C2E', outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Lumi's vibe ── */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px', fontWeight: 800,
          letterSpacing: '0.1em', color: '#9895B0',
          marginBottom: 10, paddingLeft: 2,
        }}>
          LUMI&apos;S VIBE
        </p>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32,
        }}>
          {STYLES.map(s => {
            const active = commStyle === s.value
            return (
              <button
                key={s.value}
                onClick={() => setCommStyle(s.value)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1.5px solid ${active ? 'rgba(244,165,130,0.45)' : 'rgba(45,42,62,0.08)'}`,
                  background: active
                    ? 'linear-gradient(135deg, rgba(244,165,130,0.08), rgba(245,201,138,0.07))'
                    : 'white',
                  boxShadow: active ? '0 2px 8px rgba(244,165,130,0.12)' : '0 1px 4px rgba(45,42,62,0.04)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: active ? 'rgba(244,165,130,0.14)' : 'rgba(45,42,62,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  {s.icon(active ? '#C86040' : '#9895B0')}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '14px', fontWeight: 700,
                    color: active ? '#C86040' : '#1E1C2E',
                    marginBottom: 2, transition: 'color 0.15s',
                  }}>
                    {s.label}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '12px', fontWeight: 500, color: '#9895B0',
                  }}>
                    {s.desc}
                  </p>
                </div>

                {/* Checkmark */}
                {active && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="9" cy="9" r="9" fill="url(#vibe-grad)" />
                    <path d="M5.5 9L8 11.5L12.5 6.5" stroke="#1E1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="vibe-grad" x1="0" y1="0" x2="18" y2="18">
                        <stop stopColor="#F4A582"/><stop offset="1" stopColor="#F5C98A"/>
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: saved
              ? 'rgba(94,194,105,0.15)'
              : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px', fontWeight: 800,
            color: saved ? '#3a9a47' : '#1E1C2E',
            transition: 'all 0.2s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save preferences'}
        </button>

      </div>
    </div>
  )
}
