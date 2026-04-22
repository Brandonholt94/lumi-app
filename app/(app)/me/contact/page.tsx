'use client'

import { useState } from 'react'
import Link from 'next/link'
import MeHeader from '../_components/MeHeader'

const TOPICS = [
  { value: 'bug', label: '🐛 Report a bug' },
  { value: 'feedback', label: '💡 Feature idea' },
  { value: 'billing', label: '💳 Billing question' },
  { value: 'other', label: '💬 Something else' },
]

export default function ContactPage() {
  const [topic,   setTopic]   = useState('feedback')
  const [message, setMessage] = useState('')
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState(false)

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    setError(false)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, message }),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>
        <MeHeader title="Contact us" />
        <div className="px-5 flex flex-col items-center" style={{ paddingTop: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '20px', fontWeight: 800, color: '#1E1C2E', marginBottom: 10 }}>
            Message sent!
          </p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 500, color: '#9895B0', lineHeight: 1.5 }}>
            We read every message and usually reply within 24 hours. Thank you for helping make Lumi better.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>

      <MeHeader title="Contact us" />

      <div className="px-5" style={{ paddingTop: 20 }}>

        {/* Topic */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          WHAT&apos;S THIS ABOUT?
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {TOPICS.map(t => (
            <button
              key={t.value}
              onClick={() => setTopic(t.value)}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: `1.5px solid ${topic === t.value ? '#F4A582' : 'rgba(45,42,62,0.12)'}`,
                background: topic === t.value
                  ? 'linear-gradient(135deg, rgba(244,165,130,0.12), rgba(245,201,138,0.12))'
                  : 'white',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 700,
                color: topic === t.value ? '#2D2A3E' : '#9895B0',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          YOUR MESSAGE
        </p>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind..."
          rows={5}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1px solid rgba(45,42,62,0.1)',
            background: 'white',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#2D2A3E',
            outline: 'none',
            resize: 'none',
            marginBottom: 16,
            boxSizing: 'border-box',
            lineHeight: 1.5,
          }}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: message.trim() && !sending ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.08)',
            border: 'none',
            cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: message.trim() && !sending ? '#1E1C2E' : '#9895B0',
          }}
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>

        {error && (
          <p style={{
            marginTop: 10,
            textAlign: 'center',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#E05050',
          }}>
            Something went wrong — try again or email us directly at hey@lumimind.app
          </p>
        )}

        <p style={{
          marginTop: 16,
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(45,42,62,0.3)',
        }}>
          We reply to every message. Built by Lumi Mind.
        </p>

      </div>
    </div>
  )
}
