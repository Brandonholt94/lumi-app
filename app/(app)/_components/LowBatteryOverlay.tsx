'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMood } from './MoodContext'

interface FocusTask { text: string; id?: string }
interface Message { id: string; role: 'user' | 'assistant'; content: string }

export default function LowBatteryOverlay() {
  const { mood, dismissLowBattery, lowBatteryDismissed } = useMood()
  const [task, setTask] = useState<FocusTask | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    id: 'lumi-init', role: 'assistant',
    content: "Hey. I'm here. No pressure — what's on your mind?",
  }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const all = [...messages, userMsg]
    setMessages(all)
    setStreaming(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: all.map(m => ({ role: m.role, content: m.content })) }),
        signal: ctrl.signal,
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let built = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        built += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: built } : m))
      }
    } catch { /* aborted or network error */ }
    finally { setStreaming(false) }
  }

  useEffect(() => {
    if (mood === 'drained' && !lowBatteryDismissed) {
      fetch('/api/focus')
        .then(r => r.json())
        .then(d => { if (d?.text) setTask(d) })
        .catch(() => {})
    }
  }, [mood, lowBatteryDismissed])

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, chatOpen])

  if (mood !== 'drained' || lowBatteryDismissed) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(15,13,30,0.5)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '28rem',
        background: '#1E1C2E',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 28px 40px',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Ambient dots */}
        {[
          { top: '8%',  left: '15%',  size: 2, opacity: 0.25 },
          { top: '14%', left: '78%',  size: 3, opacity: 0.18 },
          { top: '28%', left: '92%',  size: 2, opacity: 0.2  },
          { top: '62%', left: '6%',   size: 2, opacity: 0.15 },
          { top: '75%', left: '88%',  size: 3, opacity: 0.2  },
          { top: '88%', left: '42%',  size: 2, opacity: 0.18 },
        ].map((dot, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: dot.top, left: dot.left,
            width: dot.size, height: dot.size,
            borderRadius: '50%',
            background: `rgba(244,165,130,${dot.opacity})`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          transform: 'translateX(-50%)',
          width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(244,165,130,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Image
          src="/lumi-stacked-white.svg" alt="Lumi" width={90} height={90} priority
          style={{ marginBottom: 8, position: 'relative', zIndex: 1 }}
        />

        {/* Mode label */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 800,
          letterSpacing: '0.12em', color: 'rgba(244,165,130,0.7)',
          marginBottom: 32, position: 'relative', zIndex: 1,
        }}>
          LOW BATTERY MODE
        </p>

        {/* Warm message */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '20px',
          marginBottom: 16, width: '100%', position: 'relative', zIndex: 1,
        }}>
          <p style={{ fontFamily: 'var(--font-aegora)', fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1.35 }}>
            You don&apos;t have to do everything today.
          </p>
          <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5 }}>
            Rest is part of the work. Lumi is here.
          </p>
        </div>

        {/* One Focus */}
        {task && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '16px 20px',
            marginBottom: 16, width: '100%', position: 'relative', zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(244,165,130,0.6)' }}>
                IF ANYTHING — JUST THIS
              </p>
              <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 9, fontWeight: 700, color: 'rgba(232,160,191,0.7)', letterSpacing: '0.06em' }}>
                easy wins only
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
              {task.text}
            </p>
          </div>
        )}

        {/* Talk to Lumi */}
        <button
          onClick={() => setChatOpen(true)}
          style={{
            width: '100%', padding: '15px',
            background: 'linear-gradient(135deg, rgba(244,165,130,0.9), rgba(245,201,138,0.9))',
            borderRadius: 14, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 800,
            color: '#1E1C2E', marginBottom: 12, position: 'relative', zIndex: 1,
          }}
        >
          Talk to Lumi
        </button>

        {/* Low-friction shortcuts */}
        <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Focus session', href: '/focus' },
            { label: 'Brain dump', href: '/capture' },
            { label: 'Profile', href: '/me' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={dismissLowBattery}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 12, textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none', display: 'block',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Exit */}
        <button
          onClick={dismissLowBattery}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', padding: '8px 0', position: 'relative', zIndex: 1,
          }}
        >
          I&apos;m feeling better →
        </button>

        {/* ── Inline chat panel ── */}
        {chatOpen && (
          <>
          {/* Tap outside to close */}
          <div
            onClick={() => setChatOpen(false)}
            style={{ position: 'absolute', inset: 0, bottom: '72%', zIndex: 9 }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '72%',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(32px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px 24px 0 0',
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
            zIndex: 10,
          }}>

            {/* Handle + close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px 8px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  position: 'absolute', right: 16, top: 10,
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%', padding: '10px 14px', borderRadius: 16,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                    background: m.role === 'user'
                      ? 'rgba(244,165,130,0.25)'
                      : 'rgba(255,255,255,0.08)',
                    border: m.role === 'user'
                      ? '1px solid rgba(244,165,130,0.3)'
                      : '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 500,
                      color: m.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
                      lineHeight: 1.5, margin: 0,
                    }}>
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {streaming && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'rgba(244,165,130,0.6)',
                        animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', gap: 8, padding: '10px 16px 20px', flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Say anything…"
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: 'var(--font-nunito-sans)', fontSize: 14, fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !input.trim() || streaming ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          </>
        )}

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes dotPulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )
}
