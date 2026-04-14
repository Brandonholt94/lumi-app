'use client'

import { useState } from 'react'
import MeHeader from '../_components/MeHeader'

const NAMES = [
  { value: 'first_name', label: 'By first name', example: '"Hey, Sarah!"' },
  { value: 'nickname', label: 'Nickname', example: 'What should Lumi call you?' },
  { value: 'friend', label: 'Just "friend"', example: '"Hey, friend!"' },
]

const STYLES = [
  { value: 'warm', label: '🌅 Warm & gentle', desc: 'Soft, encouraging, like a close friend' },
  { value: 'direct', label: '⚡ Direct & focused', desc: 'Gets to the point, no fluff' },
  { value: 'playful', label: '✨ Playful & light', desc: 'A little humor, keeps it fun' },
  { value: 'calm', label: '🌊 Calm & steady', desc: 'Low-key, grounded, no pressure' },
]

export default function LumiPreferencesPage() {
  const [nameStyle, setNameStyle] = useState('first_name')
  const [nickname, setNickname] = useState('')
  const [commStyle, setCommStyle] = useState('warm')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // TODO: persist to Supabase user_preferences table
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="How Lumi addresses you" />

      <div className="px-5">

        {/* Name style */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          WHAT LUMI CALLS YOU
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {NAMES.map((n, i) => (
            <button
              key={n.value}
              onClick={() => setNameStyle(n.value)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < NAMES.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: i < NAMES.length - 1 ? 1 : 0,
                borderBottomStyle: 'solid',
                borderBottomColor: 'rgba(45,42,62,0.06)',
                cursor: 'pointer',
                gap: 12,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: nameStyle === n.value ? 'none' : '2px solid rgba(45,42,62,0.15)',
                background: nameStyle === n.value ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {nameStyle === n.value && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E1C2E' }} />
                )}
              </div>
              <div>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#2D2A3E',
                  marginBottom: 2,
                }}>
                  {n.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#9895B0',
                }}>
                  {n.example}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Nickname input */}
        {nameStyle === 'nickname' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#9895B0',
              marginBottom: 8,
              paddingLeft: 4,
            }}>
              YOUR NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="What should Lumi call you?"
              style={{
                width: '100%',
                background: 'white',
                borderRadius: 12,
                border: '1px solid rgba(45,42,62,0.1)',
                padding: '14px 16px',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '15px',
                fontWeight: 600,
                color: '#1E1C2E',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Communication style */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          LUMI&apos;S VIBE
        </p>

        <div style={{ marginBottom: 24 }}>
          {STYLES.map(s => (
            <button
              key={s.value}
              onClick={() => setCommStyle(s.value)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                marginBottom: 8,
                borderRadius: 14,
                border: `1.5px solid ${commStyle === s.value ? '#F4A582' : 'rgba(45,42,62,0.08)'}`,
                background: commStyle === s.value
                  ? 'linear-gradient(135deg, rgba(244,165,130,0.08), rgba(245,201,138,0.08))'
                  : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#2D2A3E',
                  marginBottom: 2,
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#9895B0',
                }}>
                  {s.desc}
                </p>
              </div>
              {commStyle === s.value && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="9" cy="9" r="9" fill="url(#check-grad)" />
                  <path d="M5.5 9L8 11.5L12.5 6.5" stroke="#1E1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="check-grad" x1="0" y1="0" x2="18" y2="18">
                      <stop stopColor="#F4A582"/>
                      <stop offset="1" stopColor="#F5C98A"/>
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: saved ? '#5A9F7A' : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: saved ? 'white' : '#1E1C2E',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Saved!' : 'Save preferences'}
        </button>

      </div>
    </div>
  )
}
