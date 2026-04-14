'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMood } from '../_components/MoodContext'
import { useUser } from '@clerk/nextjs'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FocusContext {
  task: string | null
  completed: boolean
}

// Lumi brandmark — gradient rays on dark circle avatar
function LumiBrandmarkWhite({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 295" fill="none">
      <defs>
        <linearGradient id="mark-grad" x1="0" y1="0" x2="400" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5C98A"/>
          <stop offset="50%" stopColor="#F4A582"/>
          <stop offset="100%" stopColor="#E8A0BF"/>
        </linearGradient>
      </defs>
      <rect x="85.6" y="53.1" width="29.4" height="66.2" rx="14.7" transform="translate(-31.9 84.6) rotate(-40)" fill="url(#mark-grad)"/>
      <rect x="180.5" y="4.4" width="29.4" height="80.9" rx="14.7" fill="url(#mark-grad)"/>
      <rect x="31.2" y="126.2" width="31.4" height="58.8" rx="15.7" transform="translate(-115.6 157.8) rotate(-74)" fill="url(#mark-grad)"/>
      <rect x="325.1" y="126.2" width="31.4" height="58.8" rx="15.7" transform="translate(396.4 -214.9) rotate(74)" fill="url(#mark-grad)"/>
      <rect x="272.7" y="53.2" width="29.4" height="66.2" rx="14.7" transform="translate(122.7 -164.6) rotate(40)" fill="url(#mark-grad)"/>
      <circle cx="195.2" cy="196.4" r="89.3" fill="url(#mark-grad)"/>
    </svg>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div style={{
        width: 28, height: 28, minWidth: 28, minHeight: 28,
        borderRadius: '50%',
        background: '#2D2A3E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <LumiBrandmarkWhite size={14} />
      </div>
      <div className="px-4 py-3" style={{
        borderRadius: 20,
        background: 'rgba(255,248,244,0.38)',
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 4px 24px rgba(244,165,130,0.18)',
      }}>
        <div className="flex gap-[5px] items-center" style={{ height: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#C4A882',
              animation: 'lumiBubble 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ChatPage() {
  const { mood } = useMood()
  const { user } = useUser()
  const firstName = user?.firstName ?? 'there'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [focusCtx, setFocusCtx] = useState<FocusContext>({ task: null, completed: false })
  const [started, setStarted] = useState(false) // true once messages exist

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    async function loadFocusContext() {
      try {
        const params = mood ? `?mood=${mood}` : ''
        const res = await fetch(`/api/focus${params}`)
        const data = await res.json()
        setFocusCtx({ task: data.task ?? null, completed: false })
      } catch { /* non-critical */ }
    }
    loadFocusContext()
  }, [mood])

  // Load today's chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat/history')
        if (!res.ok) return
        const { messages: stored } = await res.json()
        if (stored?.length > 0) {
          setMessages(stored.map((m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })))
          setStarted(true)
        }
      } catch { /* non-critical */ }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function toggleListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
      if (inputRef.current) {
        inputRef.current.style.height = '44px'
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
      }
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    // First message — transition out of empty state
    if (!started) setStarted(true)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsTyping(true)
    setIsStreaming(true)
    if (inputRef.current) inputRef.current.style.height = '44px'
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userContext: { mood, focusTask: focusCtx.task, focusTaskCompleted: focusCtx.completed },
        }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      setIsTyping(false)
      const assistantId = `assistant-${Date.now()}`
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }])
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m))
      }
      // Persist today's conversation (fire and forget)
      const assistantTimestamp = new Date()
      const historyToSave = [
        ...updatedMessages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
        { id: assistantId, role: 'assistant', content: accumulated, timestamp: assistantTimestamp.toISOString() },
      ]
      fetch('/api/chat/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyToSave }),
      }).catch(() => {})
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Something went sideways on my end. Want to try again?",
        timestamp: new Date(),
      }])
    } finally {
      setIsTyping(false)
      setIsStreaming(false)
    }
  }, [messages, isStreaming, mood, focusCtx, started])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <>
      <style>{`
        @keyframes lumiBubble {
          0%,100% { opacity:0.3; transform:translateY(0); }
          50% { opacity:1; transform:translateY(-3px); }
        }
        @keyframes lumiIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes lumiPulse {
          0%,100% { transform:scale(1); }
          50% { transform:scale(1.12); }
        }
        @keyframes lumiGreetIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lumi-input::placeholder { color: #B0ADBE; }
        .lumi-scroll::-webkit-scrollbar { display:none; }
        .lumi-scroll { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div
        className="fixed z-40 flex flex-col"
        style={{
          top: 0, bottom: 0, left: 0, right: 0,
          maxWidth: '28rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          height: '100dvh',
          background: 'radial-gradient(ellipse 90% 55% at 70% 45%, rgba(244,165,130,0.24) 0%, rgba(245,201,138,0.12) 50%, #FBF8F5 78%)',
        }}
      >

        {/* ── CHAT AREA ── */}
        <div
          className="flex-1 lumi-scroll relative"
          style={{
            background: 'radial-gradient(ellipse 90% 55% at 70% 45%, rgba(244,165,130,0.24) 0%, rgba(245,201,138,0.12) 50%, #FBF8F5 78%)',
            overflowY: started ? 'auto' : 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!started ? (
            /* ── EMPTY STATE — greeting centered ── */
            <div className="flex-1 flex flex-col items-center justify-center px-8"
              style={{ animation: 'lumiGreetIn 0.5s ease-out both' }}>
              <p style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '36px',
                fontWeight: 900,
                lineHeight: 1.15,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F4A582 0%, #F5C98A 40%, #8FAAE0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Hey, {firstName}.
              </p>
              <p style={{
                fontFamily: 'var(--font-quicksand)',
                fontSize: '15px',
                fontWeight: 500,
                color: '#9895B0',
                marginTop: 10,
                textAlign: 'center',
              }}>
                What&apos;s on your mind?
              </p>
            </div>
          ) : (
            /* ── MESSAGES — anchored to bottom ── */
            <div
              className="lumi-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '20px 16px 12px',
              }}
            >
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                      animation: i > 0 ? 'lumiIn 0.2s ease-out both' : undefined,
                    }}
                  >
                    {/* Lumi avatar — left side only */}
                    {!isUser && (
                      <div style={{
                        width: 28, height: 28, minWidth: 28, minHeight: 28,
                        borderRadius: '50%',
                        background: '#2D2A3E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginRight: 8,
                        marginTop: 2,
                      }}>
                        <LumiBrandmarkWhite size={14} />
                      </div>
                    )}

                    {/* Bubble + timestamp */}
                    <div style={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      gap: 4,
                    }}>
                      <div style={{
                        borderRadius: 20,
                        padding: '11px 15px',
                        background: isUser
                          ? 'rgba(28,26,44,0.74)'
                          : 'rgba(255,248,244,0.38)',
                        backdropFilter: 'blur(28px) saturate(1.6)',
                        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
                        border: isUser
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid rgba(255,255,255,0.75)',
                        boxShadow: isUser
                          ? '0 4px 24px rgba(20,18,38,0.2)'
                          : '0 4px 24px rgba(244,165,130,0.18)',
                        fontFamily: 'var(--font-quicksand)',
                        fontSize: '15px',
                        fontWeight: 500,
                        color: isUser ? '#F0EEF8' : '#2D2A3E',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-nunito-sans)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#B0ADBE',
                      }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })}

              {isTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── INPUT BAR ── */}
        <div
          className="flex-shrink-0 px-4 pt-3"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px + 12px)',
            background: '#FBF8F5',
            borderTop: '1px solid rgba(45,42,62,0.07)',
          }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl px-3"
            style={{
              background: 'white',
              border: '1.5px solid rgba(45,42,62,0.09)',
              boxShadow: '0 1px 6px rgba(45,42,62,0.05)',
              minHeight: 56,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind? Lumi's here…"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none lumi-input"
              style={{
                fontFamily: 'var(--font-quicksand)',
                fontSize: '15px',
                fontWeight: 500,
                color: '#2D2A3E',
                caretColor: '#F4A582',
                height: '40px',
                lineHeight: '40px',
                paddingTop: 0,
                paddingBottom: 0,
                alignSelf: 'center',
              }}
            />

            {/* Button — always 36×36 circle, never distorted */}
            {input.trim() ? (
              <button
                onClick={() => sendMessage(input)}
                disabled={isStreaming}
                className="transition-all active:scale-90"
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  minHeight: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
                    stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={toggleListening}
                className="transition-all active:scale-90"
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  minHeight: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isListening ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.06)',
                  animation: isListening ? 'lumiPulse 1s ease-in-out infinite' : undefined,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill={isListening ? '#1E1C2E' : '#7A7890'}/>
                  <path d="M5 10C5 14.4183 8.13401 18 12 18C15.866 18 19 14.4183 19 10"
                    stroke={isListening ? '#1E1C2E' : '#7A7890'} strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="18" x2="12" y2="22"
                    stroke={isListening ? '#1E1C2E' : '#7A7890'} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {isListening && (
            <p className="text-center mt-2" style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#F4A582',
            }}>
              Listening…
            </p>
          )}
        </div>
      </div>
    </>
  )
}
