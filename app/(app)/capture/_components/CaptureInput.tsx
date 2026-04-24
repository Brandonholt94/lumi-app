'use client'

import { useState, useRef, useEffect } from 'react'

type Tag = 'task' | 'idea' | 'worry' | 'reminder' | null

interface Subtask {
  text: string
  minutes: number
  completed?: boolean
}

interface Capture {
  id: string
  text: string
  tag: Tag
  created_at: string
  completed: boolean
  subtasks?: Subtask[] | null
  is_one_focus?: boolean
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
  const [breakdownForId, setBreakdownForId] = useState<string | null>(null)
  const [breakdownTask, setBreakdownTask] = useState<string>('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownError, setBreakdownError] = useState(false)
  const [savingSteps, setSavingSteps] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [actionSheetFor, setActionSheetFor] = useState<Capture | null>(null)
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())
  const [showDone, setShowDone] = useState(false)
  const [suggestedTag, setSuggestedTag] = useState<Tag>(null)
  const [showAll, setShowAll] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const classifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Desktop detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Reset showAll when filter changes
  useEffect(() => { setShowAll(false) }, [filter])

  // Load captures from Supabase on mount
  useEffect(() => {
    fetch('/api/captures')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCaptures(data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Debounced tag classification — fires 700ms after user stops typing
  useEffect(() => {
    if (classifyTimer.current) clearTimeout(classifyTimer.current)
    // Clear suggestion if user manually picked a tag or cleared text
    if (!text.trim() || text.trim().length < 8 || selectedTag) {
      setSuggestedTag(null)
      return
    }
    classifyTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        const { tag } = await res.json()
        // Only suggest if user still hasn't picked a tag
        if (tag && !selectedTag) setSuggestedTag(tag as Tag)
      } catch { /* silent */ }
    }, 700)
    return () => { if (classifyTimer.current) clearTimeout(classifyTimer.current) }
  }, [text, selectedTag])

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<SpeechRecognitionResult>)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
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
        setSuggestedTag(null)
        textareaRef.current?.focus()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture()
  }

  async function handleBreakdown(capture: Capture) {
    setBreakdownTask(capture.text)
    setBreakdownForId(capture.id)
    setSubtasks([])
    setBreakdownError(false)
    setBreakdownLoading(true)
    try {
      const res = await fetch('/api/captures/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: capture.text }),
      })
      if (!res.ok) { setBreakdownError(true); return }
      const data = await res.json()
      if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        setSubtasks(data.subtasks)
      } else {
        setBreakdownError(true)
      }
    } catch {
      setBreakdownError(true)
    } finally {
      setBreakdownLoading(false)
    }
  }

  async function handleSaveSteps() {
    if (!subtasks.length || savingSteps || !breakdownForId) return
    setSavingSteps(true)
    try {
      const res = await fetch('/api/captures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: breakdownForId, subtasks }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCaptures(prev => prev.map(c => c.id === breakdownForId ? { ...c, subtasks: updated.subtasks } : c))
        setExpandedIds(prev => new Set(prev).add(breakdownForId))
      }
      setBreakdownForId(null)
      setSubtasks([])
    } finally {
      setSavingSteps(false)
    }
  }

  async function toggleComplete(capture: Capture) {
    const next = !capture.completed
    setCaptures(prev => prev.map(c => c.id === capture.id ? { ...c, completed: next } : c))
    if (next) {
      // fade out then move to done section after 1.8s
      setFadingIds(prev => new Set(prev).add(capture.id))
      setTimeout(() => {
        setFadingIds(prev => { const s = new Set(prev); s.delete(capture.id); return s })
      }, 1800)
    }
    await fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: capture.id, completed: next }),
    })
  }

  async function toggleSubtask(capture: Capture, index: number) {
    const updated = (capture.subtasks ?? []).map((st, i) =>
      i === index ? { ...st, completed: !st.completed } : st
    )
    const allDone = updated.every(st => st.completed)
    setCaptures(prev => prev.map(c =>
      c.id === capture.id ? { ...c, subtasks: updated, completed: allDone ? true : c.completed } : c
    ))
    if (allDone && !capture.completed) {
      setFadingIds(prev => new Set(prev).add(capture.id))
      setTimeout(() => {
        setFadingIds(prev => { const s = new Set(prev); s.delete(capture.id); return s })
      }, 1800)
    }
    await fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: capture.id, subtasks: updated, ...(allDone ? { completed: true } : {}) }),
    })
  }

  async function deleteCapture(id: string) {
    setCaptures(prev => prev.filter(c => c.id !== id))
    setActionSheetFor(null)
    await fetch(`/api/captures?id=${id}`, { method: 'DELETE' })
  }

  async function setOneFocus(capture: Capture) {
    // Optimistically update local state
    setCaptures(prev => prev.map(c => ({ ...c, is_one_focus: c.id === capture.id })))
    setActionSheetFor(null)
    await fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: capture.id, is_one_focus: true }),
    })
  }

  const allFiltered = captures.filter(c => {
    if (filter === 'all') return true
    if (filter === 'none') return c.tag === null
    return c.tag === filter
  })
  const filtered = allFiltered.filter(c => !c.completed || fadingIds.has(c.id))
  const completedToday = allFiltered.filter(c => c.completed && !fadingIds.has(c.id) && isToday(c.created_at))

  const DESKTOP_LIMIT = 5
  const visibleCaptures = isDesktop && !showAll ? filtered.slice(0, DESKTOP_LIMIT) : filtered
  const hiddenCount = filtered.length - DESKTOP_LIMIT

  const activeFilter = FILTER_OPTIONS.find(o => o.value === filter)

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      {/* ── Beige body ── */}
      <div className="lumi-capture-outer" style={{ background: 'radial-gradient(ellipse 100% 55% at 100% 0%, rgba(244,165,130,0.28) 0%, transparent 62%), radial-gradient(ellipse 100% 55% at 0% 0%, rgba(245,201,138,0.20) 0%, transparent 62%), #FBF8F5', padding: '44px 20px 0' }}>
      <div className="lumi-capture-layout">
      <div className="lumi-capture-left">

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
            fontWeight: 500,
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
            autoFocus
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

        {/* Lumi tag suggestion */}
        {suggestedTag && !selectedTag && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px',
            borderRadius: 12,
            background: 'rgba(244,165,130,0.07)',
            border: '1px solid rgba(244,165,130,0.18)',
            marginBottom: 6,
            animation: 'fadeIn 0.2s ease',
          }}>
            <span style={{ fontSize: 13 }}>✦</span>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: 12,
              fontWeight: 500,
              color: '#9895B0',
              flex: 1,
            }}>
              Lumi thinks this is a <strong style={{ color: TAG_STYLES[suggestedTag].color }}>{TAG_STYLES[suggestedTag].label}</strong>
            </span>
            <button
              onClick={() => { setSelectedTag(suggestedTag); setSuggestedTag(null) }}
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 99,
                border: `1.5px solid ${TAG_STYLES[suggestedTag].color}`,
                background: TAG_STYLES[suggestedTag].bg,
                color: TAG_STYLES[suggestedTag].color,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
            <button
              onClick={() => setSuggestedTag(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#9895B0', fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
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

      </div>{/* end lumi-capture-left */}
      <div className="lumi-capture-right">

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
                borderRadius: '20px',
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
            flex: 1,
          }}
        >
          RECENT CAPTURES
        </p>

        {!loading && captures.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(45,42,62,0.3)',
          }}>
            {captures.length} this week
          </span>
        )}
      </div>

      {/* Captures list */}
      {loading ? (
        // Skeleton shimmer — 3 placeholder cards
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[88, 65, 76].map((w, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 20, padding: '16px 14px',
              border: '1px solid rgba(45,42,62,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(45,42,62,0.07)', flexShrink: 0 }} />
              <div style={{
                height: 13, width: `${w}%`, borderRadius: 6,
                background: 'linear-gradient(90deg, rgba(45,42,62,0.05) 25%, rgba(45,42,62,0.10) 50%, rgba(45,42,62,0.05) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            </div>
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      ) : captures.length === 0 ? (
        // Empty state card
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '36px 24px 32px',
          background: 'white', borderRadius: 20,
          border: '1px solid rgba(45,42,62,0.07)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(232,160,191,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 256 256" fill="rgba(184,96,144,0.65)">
              <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"/>
            </svg>
          </div>
          <p style={{
            fontFamily: 'var(--font-aegora)', fontSize: '18px', fontWeight: 700,
            color: '#1E1C2E', marginBottom: 8,
          }}>
            Head&apos;s clear
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500,
            color: '#9895B0', lineHeight: 1.6, maxWidth: '220px',
          }}>
            Nothing rattling around yet. Type something above — tasks, worries, random thoughts. All of it counts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {filtered.length === 0 && (
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(45,42,62,0.3)',
              textAlign: 'center',
              padding: '24px 0',
            }}>
              Nothing {filter === 'none' ? 'untagged' : `tagged as ${activeFilter?.label.toLowerCase()}`} yet.
            </p>
          )}
          {visibleCaptures.map(capture => {
            const s = capture.tag ? TAG_STYLES[capture.tag] : null
            return (
              <div
                key={capture.id}
                style={{
                  background: 'white',
                  border: '1px solid rgba(45,42,62,0.07)',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(45,42,62,0.07)',
                  overflow: 'hidden',
                  opacity: fadingIds.has(capture.id) ? 0 : 1,
                  transition: fadingIds.has(capture.id) ? 'opacity 1.6s ease' : 'opacity 0.2s',
                }}
              >
                {/* Main row */}
                <div
                  className="flex items-start gap-[10px]"
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => setActionSheetFor(capture)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleComplete(capture) }}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      border: `2px solid ${capture.completed ? '#F4A582' : (s?.dot ?? 'rgba(45,42,62,0.2)')}`,
                      background: capture.completed ? 'linear-gradient(135deg, #F4A582, #E8A0BF)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s', padding: 0,
                    }}
                  >
                    {capture.completed && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l3 3 4-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <p
                      style={{
                        fontFamily: 'var(--font-nunito-sans)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: capture.completed ? '#9895B0' : '#2D2A3E',
                        lineHeight: 1.4,
                        marginBottom: 3,
                        transition: 'color 0.15s',
                      }}
                    >
                      {capture.completed && <span style={{ marginRight: 5 }}>🎉</span>}
                      {capture.text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10.5px', fontWeight: 500, color: '#9895B0' }}>
                        {s ? `${s.label} · ` : ''}{isToday(capture.created_at) ? 'Today' : 'Yesterday'} at {formatTime(capture.created_at)}
                      </p>
                      {capture.subtasks && capture.subtasks.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedIds(prev => {
                            const next = new Set(prev)
                            next.has(capture.id) ? next.delete(capture.id) : next.add(capture.id)
                            return next
                          })}}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '10px', fontWeight: 800,
                            color: '#9895B0', padding: '2px 0',
                            whiteSpace: 'nowrap', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}
                        >
                          {capture.subtasks.filter(s => s.completed).length}/{capture.subtasks.length} steps
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: expandedIds.has(capture.id) ? 'rotate(180deg)' : 'none' }}>
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtasks inline */}
                {capture.subtasks && capture.subtasks.length > 0 && expandedIds.has(capture.id) && (
                  <div style={{ borderTop: '1px solid rgba(45,42,62,0.06)', padding: '6px 14px 8px 14px' }}>
                    {capture.subtasks.map((st, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < capture.subtasks!.length - 1 ? '1px solid rgba(45,42,62,0.05)' : 'none' }}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSubtask(capture, i) }}
                          style={{
                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                            border: `1.5px solid ${st.completed ? '#F4A582' : 'rgba(45,42,62,0.2)'}`,
                            background: st.completed ? 'linear-gradient(135deg, #F4A582, #E8A0BF)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0, transition: 'all 0.15s',
                          }}
                        >
                          {st.completed && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <p style={{
                          fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 600,
                          color: st.completed ? '#9895B0' : '#4A4760', flex: 1, lineHeight: 1.4,
                          transition: 'color 0.15s',
                        }}>{st.text}</p>
                        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 9, fontWeight: 800, color: '#9895B0', whiteSpace: 'nowrap' }}>{st.minutes}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Show more / Show less — desktop only ── */}
          {isDesktop && hiddenCount > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                width: '100%',
                marginTop: 4,
                padding: '13px',
                background: 'white',
                border: '1px solid rgba(45,42,62,0.08)',
                borderRadius: 20,
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#7A7890',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F4A582'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,165,130,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7A7890'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(45,42,62,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Show {hiddenCount} more
            </button>
          )}
          {isDesktop && showAll && filtered.length > DESKTOP_LIMIT && (
            <button
              onClick={() => setShowAll(false)}
              style={{
                width: '100%',
                marginTop: 4,
                padding: '13px',
                background: 'white',
                border: '1px solid rgba(45,42,62,0.08)',
                borderRadius: 20,
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#7A7890',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F4A582'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,165,130,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7A7890'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(45,42,62,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ transform: 'rotate(180deg)' }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Show less
            </button>
          )}
        </div>
      )}

      {/* ── Done today section ── */}
      {completedToday.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowDone(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: showDone ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              <path d="M2 4l4 4 4-4" stroke="#9895B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#9895B0' }}>
              DONE TODAY ({completedToday.length})
            </span>
          </button>

          {showDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {completedToday.map(c => {
                const cs = c.tag ? TAG_STYLES[c.tag] : null
                return (
                  <div key={c.id} style={{
                    background: 'white', borderRadius: 12,
                    padding: '10px 14px',
                    border: '1px solid rgba(45,42,62,0.05)',
                    display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <defs>
                        <linearGradient id="doneGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F4A582"/>
                          <stop offset="100%" stopColor="#E8A0BF"/>
                        </linearGradient>
                      </defs>
                      <circle cx="8" cy="8" r="7" fill="url(#doneGrad)"/>
                      <path d="M5 8l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500,
                      color: '#9895B0', flex: 1, lineHeight: 1.4,
                    }}>🎉 {c.text}</p>
                    <button
                      onClick={() => toggleComplete(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10, color: '#9895B0', fontFamily: 'var(--font-nunito-sans)', fontWeight: 700 }}
                    >
                      Undo
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes recPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      </div>{/* end lumi-capture-right */}
      </div>{/* end lumi-capture-layout */}
      </div>{/* end beige body */}

      {/* ── Breakdown bottom sheet ── */}
      {breakdownForId && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(30,28,46,0.5)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setBreakdownForId(null) }}
        >
          <div
            style={{
              width: '100%', maxHeight: '85vh',
              background: '#FBF8F5', borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              overflowY: 'auto',
              animation: 'sheetUp 0.28s cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(45,42,62,0.15)', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#9895B0', marginBottom: 4 }}>BREAKING DOWN</p>
                <p style={{ fontFamily: 'var(--font-aegora)', fontSize: 18, fontWeight: 900, color: '#1E1C2E', lineHeight: 1.3 }}>{breakdownTask}</p>
              </div>
              <button
                onClick={() => setBreakdownForId(null)}
                style={{ background: 'rgba(45,42,62,0.07)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7890" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Loading state */}
            {breakdownLoading && (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#F4A582' }}>Lumi is thinking…</p>
              </div>
            )}

            {/* Error state */}
            {!breakdownLoading && breakdownError && (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 12 }}>
                  Couldn't break this down right now.
                </p>
                <button
                  onClick={() => handleBreakdown({ id: breakdownForId!, text: breakdownTask, tag: 'task', created_at: '', completed: false })}
                  style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 800,
                    color: '#F4A582', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  Try again →
                </button>
              </div>
            )}

            {/* Subtasks — clean numbered list */}
            {!breakdownLoading && !breakdownError && subtasks.length > 0 && (
              <>
                <div style={{ marginBottom: 24 }}>
                  {subtasks.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '11px 0',
                        borderBottom: i < subtasks.length - 1 ? '1px solid rgba(45,42,62,0.07)' : 'none',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 800,
                        color: '#F4A582', minWidth: 20, paddingTop: 1, textAlign: 'right',
                      }}>{i + 1}</span>
                      <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 14, fontWeight: 600, color: '#2D2A3E', flex: 1, lineHeight: 1.45 }}>{s.text}</p>
                      <span style={{
                        fontFamily: 'var(--font-nunito-sans)', fontSize: 10, fontWeight: 800,
                        color: '#9895B0', whiteSpace: 'nowrap', paddingTop: 3,
                      }}>{s.minutes}m</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveSteps}
                  disabled={savingSteps}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                    fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 800,
                    color: '#1E1C2E', cursor: savingSteps ? 'wait' : 'pointer',
                    opacity: savingSteps ? 0.7 : 1,
                  }}
                >
                  {savingSteps ? 'Saving…' : `Save ${subtasks.length} steps`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Action sheet (tap a card) ── */}
      {actionSheetFor && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(30,28,46,0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setActionSheetFor(null) }}
        >
          <div
            style={{
              width: '100%',
              background: 'rgba(251,248,245,0.92)',
              backdropFilter: 'blur(28px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.7)',
              padding: '20px 20px 40px',
              animation: 'sheetUp 0.25s cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(45,42,62,0.15)', margin: '0 auto 16px' }} />

            {/* Task label */}
            <p style={{
              fontFamily: 'var(--font-aegora)', fontSize: 16, fontWeight: 900,
              color: '#1E1C2E', lineHeight: 1.3, marginBottom: 20, padding: '0 4px',
            }}>
              {actionSheetFor.text}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Mark complete / incomplete */}
              <button
                onClick={() => { toggleComplete(actionSheetFor); setActionSheetFor(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14, border: 'none',
                  background: 'white', cursor: 'pointer', width: '100%', textAlign: 'left',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="actionGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F4A582"/>
                      <stop offset="100%" stopColor="#E8A0BF"/>
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="9" stroke="url(#actionGrad)" strokeWidth="2"/>
                  <path d="M8 12l3 3 5-5" stroke="url(#actionGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700, color: '#2D2A3E' }}>
                  {actionSheetFor.completed ? 'Mark as incomplete' : 'Mark as complete'}
                </span>
              </button>

              {/* Break it down — only for tasks without subtasks */}
              {actionSheetFor.tag === 'task' && !actionSheetFor.subtasks?.length && (
                <button
                  onClick={() => { setActionSheetFor(null); handleBreakdown(actionSheetFor) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, border: 'none',
                    background: 'white', cursor: 'pointer', width: '100%', textAlign: 'left',
                    marginTop: 2,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v18M3 12h18" stroke="#F4A582" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700, color: '#2D2A3E' }}>
                    Break it down
                  </span>
                </button>
              )}

              {/* Make this my One Focus — only for tasks not already pinned */}
              {actionSheetFor.tag === 'task' && !actionSheetFor.is_one_focus && !actionSheetFor.completed && (
                <button
                  onClick={() => setOneFocus(actionSheetFor)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, border: 'none',
                    background: 'white', cursor: 'pointer', width: '100%', textAlign: 'left',
                    marginTop: 2,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#F5C98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700, color: '#2D2A3E' }}>
                    Make this my One Focus
                  </span>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => deleteCapture(actionSheetFor.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14, border: 'none',
                  background: 'white', cursor: 'pointer', width: '100%', textAlign: 'left',
                  marginTop: 2,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#E8A0BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700, color: '#B04E72' }}>
                  Delete
                </span>
              </button>

              {/* Cancel */}
              <button
                onClick={() => setActionSheetFor(null)}
                style={{
                  padding: '14px 16px', borderRadius: 14, border: 'none',
                  background: 'rgba(45,42,62,0.06)', cursor: 'pointer', width: '100%',
                  fontFamily: 'var(--font-nunito-sans)', fontSize: 15, fontWeight: 700,
                  color: '#9895B0', marginTop: 8,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
