'use client'

import { useState, useRef, useEffect } from 'react'
import ProfileButton from '../../_components/ProfileButton'

type Tag = 'task' | 'idea' | 'worry' | 'reminder' | null

interface Capture {
  id: string
  text: string
  tag: Tag
  created_at: string
}

const TAG_STYLES: Record<NonNullable<Tag>, { bg: string; color: string; border: string; dot: string; label: string }> = {
  task:     { bg: 'rgba(244,165,130,0.10)', color: '#D4845A', border: 'rgba(244,165,130,0.25)', dot: '#F4A582', label: 'Task' },
  idea:     { bg: 'rgba(245,201,138,0.12)', color: '#C49A3A', border: 'rgba(245,201,138,0.28)', dot: '#F5C98A', label: 'Idea' },
  worry:    { bg: 'rgba(232,160,191,0.10)', color: '#C4669A', border: 'rgba(232,160,191,0.25)', dot: '#E8A0BF', label: 'Worry' },
  reminder: { bg: 'rgba(143,170,224,0.10)', color: '#5A7CC4', border: 'rgba(143,170,224,0.25)', dot: '#8FAAE0', label: 'Reminder' },
}

const FILTER_OPTIONS: { value: Tag | 'all' | 'none'; label: string; dot?: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'task',     label: 'Tasks',     dot: '#F4A582' },
  { value: 'idea',     label: 'Ideas',     dot: '#F5C98A' },
  { value: 'worry',    label: 'Worries',   dot: '#E8A0BF' },
  { value: 'reminder', label: 'Reminders', dot: '#8FAAE0' },
  { value: 'none',     label: 'Untagged',  dot: 'rgba(45,42,62,0.2)' },
]

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

export default function CaptureInput() {
  const [text, setText] = useState('')
  const [selectedTag, setSelectedTag] = useState<Tag>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [filter, setFilter] = useState<Tag | 'all' | 'none'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Load captures from Supabase on mount
  useEffect(() => {
    fetch('/api/captures')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCaptures(data)
      })
      .finally(() => setLoading(false))
  }, [])

  function startRecording() {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition

    if (!SpeechRecognition) return // browser doesn't support it

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join(' ')
        .trim()
      if (transcript) {
        setText(prev => prev ? `${prev} ${transcript}` : transcript)
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setRecording(false)
  }

  async function handleCapture() {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), tag: selectedTag }),
      })
      const newCapture = await res.json()
      if (res.ok) {
        setCaptures(prev => [newCapture, ...prev])
        setText('')
        setSelectedTag(null)
        textareaRef.current?.focus()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture()
  }

  const filtered = captures.filter(c => {
    if (filter === 'all') return true
    if (filter === 'none') return c.tag === null
    return c.tag === filter
  })

  const activeFilter = FILTER_OPTIONS.find(o => o.value === filter)

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      {/* ── White header ── */}
      <div style={{ background: '#ffffff', padding: '32px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '34px',
                fontWeight: 900,
                color: '#1E1C2E',
                lineHeight: 1.1,
                marginBottom: 6,
              }}
            >
              Brain Dump
            </h1>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#9895B0',
            }}>
              {date} · {loading ? '—' : `${captures.length} capture${captures.length !== 1 ? 's' : ''} this week`}
            </p>
          </div>
          <ProfileButton />
        </div>
      </div>

      {/* ── Beige body ── */}
      <div style={{ background: '#FBF8F5', padding: '28px 20px 0' }}>

      {/* Lumi hint */}
      <div
        className="rounded-[14px] px-4 py-3 mb-4 flex gap-[10px] items-start"
        style={{
          background: 'rgba(244,165,130,0.07)',
          border: '1.5px solid rgba(244,165,130,0.18)',
        }}
      >
        <span style={{ fontSize: '13px', marginTop: '1px', flexShrink: 0 }}>✦</span>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2D2A3E',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </strong>
          No sorting, no priority — just get it out of your head. That&apos;s the whole job right now.
        </p>
      </div>

      {/* Input card */}
      <div
        style={{
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '12px',
          background: 'white',
          border: recording ? '1.5px solid rgba(244,165,130,0.5)' : '1.5px solid rgba(45,42,62,0.08)',
          boxShadow: recording
            ? '0 0 0 3px rgba(244,165,130,0.1), 0 4px 16px rgba(45,42,62,0.08)'
            : '0 4px 16px rgba(45,42,62,0.08)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          overflow: 'hidden',
        }}
      >
        {recording ? (
          <div className="flex items-center gap-2 mb-3" style={{ minHeight: '80px' }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%', background: '#F4A582',
                animation: 'recPulse 1s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#F4A582',
              }}
            >
              Listening…
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's in your head? Dump it all here — tasks, worries, ideas, reminders. Anything."
            className="w-full border-none outline-none resize-none"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '15px',
              fontWeight: 600,
              color: '#2D2A3E',
              lineHeight: 1.6,
              background: 'transparent',
              minHeight: '100px',
            }}
          />
        )}

        {/* Footer: tags + mic */}
        <div
          className="flex items-center justify-between gap-2"
          style={{
            paddingTop: '10px',
            borderTop: '1px solid rgba(45,42,62,0.06)',
            marginTop: '4px',
          }}
        >
          <div className="flex gap-[6px] flex-wrap flex-1">
            {(Object.keys(TAG_STYLES) as NonNullable<Tag>[]).map(tag => {
              const s = TAG_STYLES[tag]
              const active = selectedTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(active ? null : tag)}
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '4px 9px',
                    borderRadius: '99px',
                    border: `1.5px solid ${active ? s.color : s.border}`,
                    background: active ? s.bg : 'transparent',
                    color: active ? s.color : s.color,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Mic */}
          <div className="flex flex-col items-center gap-[3px] flex-shrink-0">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={e => { e.preventDefault(); startRecording() }}
              onTouchEnd={e => { e.preventDefault(); stopRecording() }}
              onContextMenu={e => e.preventDefault()}
              style={{
                width: 38, height: 38,
                borderRadius: '50%',
                background: recording ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(244,165,130,0.1)',
                border: `1.5px solid ${recording ? 'transparent' : 'rgba(244,165,130,0.25)'}`,
                boxShadow: recording ? '0 0 0 4px rgba(244,165,130,0.2)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill={recording ? '#1E1C2E' : '#F4A582'} />
                <path d="M5 11a7 7 0 0014 0" stroke={recording ? '#1E1C2E' : '#F4A582'} strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke={recording ? '#1E1C2E' : '#F4A582'} strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="22" x2="15" y2="22" stroke={recording ? '#1E1C2E' : '#F4A582'} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '8.5px',
                fontWeight: 700,
                color: 'rgba(244,165,130,0.8)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              {recording ? 'Listening…' : 'Hold to speak'}
            </span>
          </div>
        </div>
      </div>

      {/* Capture button */}
      <button
        onClick={handleCapture}
        className="w-full rounded-full mb-5 transition-all active:scale-[0.98] hover:opacity-90"
        style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '15px',
          fontWeight: 800,
          color: '#1E1C2E',
          border: 'none',
          cursor: 'pointer',
          opacity: text.trim() && !saving ? 1 : 0.65,
          transition: 'opacity 0.2s',
        }}
      >
        {saving ? 'Saving…' : 'Capture it'}
      </button>

      {/* Filter pill + label row */}
      <div className="flex items-center gap-3 mb-[10px]">
        {/* Filter dropdown — left side */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(o => !o)}
            className="flex items-center gap-[5px]"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              padding: '0 12px',
              height: 28,
              borderRadius: '99px',
              border: '1.5px solid rgba(45,42,62,0.18)',
              background: filter !== 'all' ? '#1E1C2E' : 'white',
              color: filter !== 'all' ? 'white' : '#4A4760',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(45,42,62,0.08)',
            }}
          >
            {activeFilter?.label}
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none"
              style={{ transition: 'transform 0.2s', transform: filterOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {filterOpen && (
            <div
              className="absolute left-0 bottom-[calc(100%+6px)] z-50 overflow-hidden"
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(45,42,62,0.1)',
                boxShadow: '0 8px 24px rgba(45,42,62,0.12)',
                minWidth: '150px',
              }}
            >
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilter(opt.value); setFilterOpen(false) }}
                  className="w-full flex items-center gap-[10px] text-left"
                  style={{
                    padding: '11px 14px',
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: filter === opt.value ? '#F4A582' : '#2D2A3E',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(45,42,62,0.05)',
                    cursor: 'pointer',
                  }}
                >
                  {opt.dot && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, flexShrink: 0, display: 'inline-block', marginRight: 4 }} />
                  )}
                  {opt.label}
                  {filter === opt.value && <span style={{ marginLeft: 'auto', color: '#F4A582' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
            marginLeft: 2,
          }}
        >
          RECENT CAPTURES
        </p>
      </div>

      {/* Captures list */}
      {captures.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(45,42,62,0.3)',
            textAlign: 'center',
            paddingTop: '24px',
          }}
        >
          Your head is clear. Add something above.
        </p>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {filtered.map(capture => {
            const s = capture.tag ? TAG_STYLES[capture.tag] : null
            return (
              <div
                key={capture.id}
                className="rounded-[16px] flex items-start gap-[10px]"
                style={{
                  background: 'white',
                  border: '1px solid rgba(45,42,62,0.07)',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(45,42,62,0.07)',
                }}
              >
                <div
                  style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: s ? s.dot : 'rgba(45,42,62,0.2)',
                    marginTop: 5, flexShrink: 0,
                  }}
                />
                <div className="flex-1">
                  <p
                    style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#2D2A3E',
                      lineHeight: 1.4,
                      marginBottom: 3,
                    }}
                  >
                    {capture.text}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#9895B0',
                    }}
                  >
                    {s ? `${s.label} · ` : ''}{isToday(capture.created_at) ? 'Today' : 'Yesterday'} at {formatTime(capture.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes recPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
      </div>{/* end beige body */}
    </>
  )
}
