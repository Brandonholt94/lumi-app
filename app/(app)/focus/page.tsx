'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type SessionState = 'idle' | 'active' | 'paused' | 'done'
type SoundType    = 'off' | 'rain' | 'white' | 'brown'

// ─────────────────────────────────────────────────────────
// Design tokens — dark focus mode
// ─────────────────────────────────────────────────────────

const D = {
  bg:          '#1A1728',   // deep dark base (body bg fallback)
  surface:     'rgba(255,255,255,0.06)',
  border:      'rgba(255,255,255,0.09)',
  textPrimary: 'rgba(245,242,238,0.95)',
  textMuted:   'rgba(245,242,238,0.45)',
  textFaint:   'rgba(245,242,238,0.28)',
  accentBg:    'rgba(244,165,130,0.12)',
  accentBorder:'rgba(244,165,130,0.35)',
  peach:       '#F4A582',
  gold:        '#F5C98A',
  green:       '#5EC269',
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const DURATIONS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
]

const LUMI_DONE_MESSAGES = [
  "You showed up. That's the whole game.",
  "That counts. Every minute of it.",
  "Done. Your brain did something real today.",
  "Look at that. You focused. It happened.",
  "One session at a time. You're doing it.",
]


const SOUNDS: { key: SoundType; label: string }[] = [
  { key: 'off',   label: 'Off'   },
  { key: 'rain',  label: 'Rain'  },
  { key: 'white', label: 'White' },
  { key: 'brown', label: 'Deep'  },
]

// ─────────────────────────────────────────────────────────
// Ambient sound hook
// ─────────────────────────────────────────────────────────

function useAmbientSound() {
  const ctxRef  = useRef<AudioContext | null>(null)
  const srcRef  = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const stopImmediate = useCallback(() => {
    try { srcRef.current?.stop() } catch {}
    try { gainRef.current?.disconnect() } catch {}
    srcRef.current  = null
    gainRef.current = null
  }, [])

  const play = useCallback((type: SoundType) => {
    stopImmediate()
    if (type === 'off' || typeof window === 'undefined') return

    if (!ctxRef.current) ctxRef.current = new window.AudioContext()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const rate   = ctx.sampleRate
    const bufLen = rate * 6
    const buf    = ctx.createBuffer(1, bufLen, rate)
    const data   = buf.getChannelData(0)

    if (type === 'white') {
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    } else {
      let last = 0
      for (let i = 0; i < bufLen; i++) {
        const w  = Math.random() * 2 - 1
        data[i]  = (last + 0.02 * w) / 1.02
        last     = data[i]
        data[i] *= 3.5
      }
    }

    const src  = ctx.createBufferSource()
    src.buffer = buf
    src.loop   = true

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.4)

    if (type === 'rain') {
      const hpf = ctx.createBiquadFilter()
      hpf.type            = 'highpass'
      hpf.frequency.value = 180
      const bpf = ctx.createBiquadFilter()
      bpf.type            = 'bandpass'
      bpf.frequency.value = 1100
      bpf.Q.value         = 0.6
      src.connect(hpf); hpf.connect(bpf); bpf.connect(gain)
    } else {
      src.connect(gain)
    }

    gain.connect(ctx.destination)
    src.start()
    srcRef.current  = src
    gainRef.current = gain
  }, [stopImmediate])

  const cleanup = useCallback(() => {
    stopImmediate()
    ctxRef.current?.close()
    ctxRef.current = null
  }, [stopImmediate])

  return { play, cleanup }
}

// ─────────────────────────────────────────────────────────
// Sound icon
// ─────────────────────────────────────────────────────────

function SoundIcon({ type, active }: { type: SoundType; active: boolean }) {
  const c = active ? D.peach : 'rgba(245,242,238,0.3)'
  if (type === 'off') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="17" y1="9"  x2="23" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="9"  x2="17" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
  if (type === 'rain') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 12.58A8 8 0 1 0 8 20.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8"  y1="19" x2="6"  y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="19" x2="10" y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="19" x2="14" y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
  if (type === 'white') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 12h3l2-5 3 10 2-7 2 4 2-2h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 14h4l2-3 3 6 2-4 2 2h9" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// Progress ring
// ─────────────────────────────────────────────────────────

function ProgressRing({ progress, size = 240 }: { progress: number; size?: number }) {
  const stroke = 8
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#focusGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <defs>
        <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F4A582" />
          <stop offset="100%" stopColor="#F5C98A" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// Draggable ring — idle duration picker
// ─────────────────────────────────────────────────────────

function DraggableRing({
  minutes,
  onChange,
  size = 240,
}: {
  minutes: number
  onChange: (m: number) => void
  size?: number
}) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const dragging  = useRef(false)
  const prevMin   = useRef(minutes)

  const cx = size / 2
  const cy = size / 2
  const stroke = 8
  const r    = (size - stroke) / 2        // 116
  const circ = 2 * Math.PI * r

  const progress  = minutes / 60
  const arcOffset = circ * (1 - progress)

  // Handle position (clockwise from top)
  const handleAngle = (minutes / 60) * 2 * Math.PI - Math.PI / 2
  const handleX = cx + r * Math.cos(handleAngle)
  const handleY = cy + r * Math.sin(handleAngle)

  function minutesFromPointer(clientX: number, clientY: number): number {
    if (!svgRef.current) return minutes
    const rect = svgRef.current.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width  / 2)
    const dy = clientY - (rect.top  + rect.height / 2)
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI) // 0 = top, CW
    if (deg < 0) deg += 360
    const raw = Math.round(deg / 6) // 6° per minute (360/60)
    return Math.max(5, Math.min(60, raw || 60))
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    dragging.current = true
    svgRef.current?.setPointerCapture(e.pointerId)
    const m = minutesFromPointer(e.clientX, e.clientY)
    prevMin.current = m
    onChange(m)
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    const m = minutesFromPointer(e.clientX, e.clientY)
    if (m !== prevMin.current) {
      try { navigator.vibrate(1) } catch {}
      prevMin.current = m
      onChange(m)
    }
  }
  function onPointerUp() { dragging.current = false }

  // Tick marks — 60 ticks, bigger every 5 / 15
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a       = (i / 60) * 2 * Math.PI - Math.PI / 2
    const isQ     = i % 15 === 0
    const isFive  = i % 5 === 0
    const outerR  = r + stroke / 2 + 3
    const len     = isQ ? 8 : isFive ? 5 : 3
    return {
      x1: cx + outerR * Math.cos(a),
      y1: cy + outerR * Math.sin(a),
      x2: cx + (outerR - len) * Math.cos(a),
      y2: cy + (outerR - len) * Math.sin(a),
      opacity: isQ ? 0.45 : isFive ? 0.28 : 0.14,
      width: isQ ? 2 : 1.5,
    }
  })

  // Inner reference labels at r=70 from center
  const labels = [
    { min: 60, x: cx,      y: cy - 68 },
    { min: 15, x: cx + 68, y: cy      },
    { min: 30, x: cx,      y: cy + 68 },
    { min: 45, x: cx - 68, y: cy      },
  ]

  return (
    <svg
      ref={svgRef}
      width={size} height={size}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F4A582" />
          <stop offset="100%" stopColor="#F5C98A" />
        </linearGradient>
      </defs>

      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />

      {/* Filled arc */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#focusGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={arcOffset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="white" strokeOpacity={t.opacity}
          strokeWidth={t.width} strokeLinecap="round"
        />
      ))}

      {/* Reference labels */}
      {labels.map(l => (
        <text
          key={l.min}
          x={l.x} y={l.y}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fontWeight={700}
          fill="rgba(245,242,238,0.28)"
          style={{ fontFamily: 'var(--font-nunito-sans)', pointerEvents: 'none' }}
        >
          {l.min}
        </text>
      ))}

      {/* Drag handle */}
      {minutes > 0 && (
        <circle
          cx={handleX} cy={handleY} r={10}
          fill="url(#focusGrad)"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(244,165,130,0.65))' }}
        />
      )}
    </svg>
  )
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Soft single-note chime via WebAudio
function playChime() {
  try {
    const ctx  = new window.AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 528
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
    osc.onended = () => ctx.close()
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Button styles
// ─────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '17px', borderRadius: 16, border: 'none',
  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
  fontFamily: 'var(--font-nunito-sans)', fontSize: '16px', fontWeight: 800,
  color: '#1A1828', cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 16,
  border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
  fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700,
  color: 'rgba(245,242,238,0.45)', cursor: 'pointer',
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function FocusPage() {
  const [state,        setState]      = useState<SessionState>('idle')
  const [duration,     setDuration]   = useState(25) // minutes
  const [remaining,    setRemaining]  = useState(25 * 60)
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)

  const [lumiMsg] = useState(() =>
    LUMI_DONE_MESSAGES[Math.floor(Math.random() * LUMI_DONE_MESSAGES.length)]
  )

  const halfwayFiredRef = useRef(false)

  const [activeSound, setActiveSound] = useState<SoundType>('off')
  const { play, cleanup }             = useAmbientSound()

  const [showCapture,   setShowCapture]   = useState(false)
  const [thoughtText,   setThoughtText]   = useState('')
  const [thoughtSaving, setThoughtSaving] = useState(false)
  const [thoughtSaved,  setThoughtSaved]  = useState(false)

  // Body Doubling Mode
  const [taskLabel,      setTaskLabel]      = useState<string | null>(null)
  const [sessionComplete, setSessionComplete] = useState<'natural' | 'early' | null>(null)
  const [celebrating,     setCelebrating]     = useState(false)
  const [ringProgress,    setRingProgress]    = useState<number | null>(null)
  const [bdMessages,  setBdMessages]  = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([])
  const [bdInput,     setBdInput]     = useState('')
  const [bdStreaming, setBdStreaming]  = useState(false)
  const bdScrollRef = useRef<HTMLDivElement>(null)
  const bdAbortRef  = useRef<AbortController | null>(null)
  const bdInputRef  = useRef<HTMLInputElement>(null)

  // Task selection
  const [taskChips,       setTaskChips]       = useState<{ id: string; text: string }[]>([])
  const [selectedChipId,  setSelectedChipId]  = useState<string | null>(null)
  const [taskInput,       setTaskInput]       = useState('')

  // Session tracking
  const startedAtRef        = useRef<string | null>(null)
  const pauseCountRef       = useRef(0)
  const thoughtsCapturedRef = useRef(0)

  // Paint the body background so gaps below content blend in
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#E8D4C8'
    return () => { document.body.style.background = prev }
  }, [])

  // Load incomplete task-tagged captures for chip display
  useEffect(() => {
    fetch('/api/captures')
      .then(r => r.json())
      .then((data: { id: string; text: string; tag: string | null; completed?: boolean }[]) => {
        if (!Array.isArray(data)) return
        const tasks = data
          .filter(c => !c.completed)
          .slice(0, 6) // show max 6 chips
          .map(c => ({ id: c.id, text: c.text }))
        setTaskChips(tasks)
      })
      .catch(() => {})
  }, [])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  // Confetti helper — lazy import so no SSR issues
  function fireConfetti() {
    import('canvas-confetti').then(m => {
      const confetti = m.default
      // Two bursts from sides
      confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#F4A582', '#F5C98A', '#E8A0BF', '#8FAAE0', '#ffffff'] })
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#F4A582', '#F5C98A', '#E8A0BF', '#8FAAE0', '#ffffff'] })
    })
  }

  // Celebration sequence
  useEffect(() => {
    if (!sessionComplete) return
    const isEarly = sessionComplete === 'early'

    // For early end: fill the ring first, then celebrate
    if (isEarly) setRingProgress(1)

    const celebrateTimer = setTimeout(() => {
      setCelebrating(true)
      fireConfetti()

      const doneTimer = setTimeout(() => {
        setCelebrating(false)
        setRingProgress(null)
        setSessionComplete(null)
        setState('done')
      }, 2400)

      return () => clearTimeout(doneTimer)
    }, isEarly ? 550 : 80) // wait for ring fill anim if early

    return () => clearTimeout(celebrateTimer)
  }, [sessionComplete])

  // Countdown
  useEffect(() => {
    if (state === 'active') {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearTimer()
            play('off')
            saveSession(totalSeconds, totalSeconds, true)
            setSessionComplete('natural')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return clearTimer
  }, [state, clearTimer])

  // Halfway check-in
  useEffect(() => {
    if (state !== 'active' || halfwayFiredRef.current) return
    if (remaining === Math.round(totalSeconds / 2)) {
      halfwayFiredRef.current = true
      // Push into inline chat thread + haptic + chime
      setBdMessages(prev => [...prev, {
        id: 'halfway-' + Date.now(),
        role: 'assistant',
        content: 'Halfway there. How are you holding up?',
      }])
      playChime()
      try { navigator.vibrate([10, 60, 10]) } catch {}
    }
  }, [remaining, state, totalSeconds])

  const taskLabelRef = useRef<string | null>(null)

  async function saveSession(plannedSecs: number, actualSecs: number, completed: boolean) {
    if (!startedAtRef.current) return
    try {
      await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at:        startedAtRef.current,
          ended_at:          new Date().toISOString(),
          planned_duration:  plannedSecs,
          actual_duration:   actualSecs,
          completed,
          task_label:        taskLabelRef.current,
          ambient_sound:     activeSound,
          pauses:            pauseCountRef.current,
          thoughts_captured: thoughtsCapturedRef.current,
        }),
      })
    } catch {
      // non-blocking — session data loss is acceptable
    }
  }

  function start() {
    const label =
      taskInput.trim() ||
      taskChips.find(c => c.id === selectedChipId)?.text ||
      null
    taskLabelRef.current = label
    setTaskLabel(label)

    // If they typed a new task, save it to Brain Dump as a task capture
    if (taskInput.trim()) {
      fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskInput.trim(), tag: 'task' }),
      }).catch(() => {})
    }
    setRemaining(duration * 60)
    setTotalSeconds(duration * 60)
    halfwayFiredRef.current   = false
    pauseCountRef.current     = 0
    thoughtsCapturedRef.current = 0
    startedAtRef.current      = new Date().toISOString()
    // Kick off the inline body-double thread — brief delay so the
    // session start animation lands before Lumi's message appears
    setTimeout(() => {
      setBdMessages([{
        id: 'init',
        role: 'assistant',
        content: label
          ? `I'm right here with you. Let's do this — "${label}". You've got this.`
          : "I'm right here with you. No pressure — just start. What are you working on?",
      }])
      playChime()
      try { navigator.vibrate(10) } catch {}
    }, 550)

    setState('active')
  }

  function pause()  { pauseCountRef.current += 1; clearTimer(); setState('paused') }
  function resume() { setState('active') }

  function end() {
    clearTimer()
    play('off')
    const actual = totalSeconds - remaining
    saveSession(totalSeconds, actual, false)
    setSessionComplete('early')
  }

  function reset() {
    clearTimer()
    setRemaining(duration * 60)
    setTotalSeconds(duration * 60)
    halfwayFiredRef.current  = false
    taskLabelRef.current     = null
    setTaskLabel(null)
    setSelectedChipId(null)
    setTaskInput('')
    setActiveSound('off')
    play('off')
    setState('idle')
  }

  function handleSoundSelect(type: SoundType) {
    setActiveSound(type)
    play(type)
  }

  async function saveThought() {
    if (!thoughtText.trim() || thoughtSaving) return
    setThoughtSaving(true)
    try {
      await fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: thoughtText.trim(), tag: null }),
      })
      thoughtsCapturedRef.current += 1
      setThoughtSaved(true)
      setTimeout(() => {
        setShowCapture(false)
        setThoughtText('')
        setThoughtSaved(false)
      }, 1300)
    } finally {
      setThoughtSaving(false)
    }
  }


  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    bdScrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [bdMessages])

  async function sendBdMessage() {
    if (!bdInput.trim() || bdStreaming) return
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: bdInput.trim() }
    const next = [...bdMessages, userMsg]
    setBdMessages(next)
    setBdInput('')
    setBdStreaming(true)

    const assistantId = (Date.now() + 1).toString()
    setBdMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const ctrl = new AbortController()
      bdAbortRef.current = ctrl
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          mood: null,
          context: `Body Doubling Mode: user is in a ${duration} min focus session${taskLabelRef.current ? ` working on "${taskLabelRef.current}"` : ''}. Be very brief (1-2 sentences), warm, and encouraging. No lists.`,
        }),
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
        setBdMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: built } : m))
      }
    } catch { /* silent — abort or network */ }
    finally { setBdStreaming(false) }
  }

  const progress  = ringProgress !== null ? ringProgress
    : state === 'idle' ? 0
    : (totalSeconds - remaining) / totalSeconds
  const inSession = state === 'active' || state === 'paused' || !!sessionComplete

  const subtitle =
    state === 'idle'   ? "Pick a task and start when you're ready." :
    state === 'active' ? (taskLabelRef.current ? `"${taskLabelRef.current}"` : `${duration} min session · in progress`) :
    state === 'paused' ? (taskLabelRef.current ? `Paused · "${taskLabelRef.current}"` : "Paused — resume whenever you're ready.") :
    'Session complete'

  return (
    <div
      className="flex flex-col flex-1 overflow-y-auto"
      style={{
        background: '#1A1728',
        position: 'relative',
      }}
    >
      {/* ── Sun radial glow — breathing orb on dark ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%', position: 'absolute',
          background: [
            'radial-gradient(circle 280px at 50% 38%,',
            '  rgba(255,248,210,0.14) 0%,',
            '  rgba(245,201,138,0.18) 18%,',
            '  rgba(244,165,130,0.13) 38%,',
            '  rgba(232,160,191,0.07) 58%,',
            '  transparent 80%)',
          ].join(''),
          animation: 'sunBreathe 5s ease-in-out infinite',
          transformOrigin: '50% 38%',
        }} />
      </div>

      {/* ── Grain overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.38,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'soft-light',
      }} />

      {/* ── All content sits above grain ── */}
      <div className="flex flex-col flex-1" style={{ position: 'relative', zIndex: 2 }}>
      {/* ── Body ── */}
      <div className="flex flex-col flex-1 px-6 pb-8" style={{ paddingTop: 48 }}>

        {/* IDLE — task picker + duration */}
        {state === 'idle' && (
          <>
            {/* Task section */}
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
              letterSpacing: '0.1em', color: D.textFaint, marginBottom: 12,
            }}>
              WHAT ARE YOU FOCUSING ON?
            </p>

            {/* Brain Dump dropdown */}
            {taskChips.length > 0 && (
              <select
                value={selectedChipId ?? ''}
                onChange={e => {
                  setSelectedChipId(e.target.value || null)
                  setTaskInput('')
                }}
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 14,
                  border: `1.5px solid ${selectedChipId ? 'rgba(244,165,130,0.5)' : D.border}`,
                  background: D.surface,
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600,
                  color: selectedChipId ? D.textPrimary : D.textMuted,
                  outline: 'none', cursor: 'pointer', marginBottom: 10,
                  appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='rgba(245,242,238,0.40)' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 36,
                }}
              >
                <option value="" style={{ background: '#1A1728', color: 'rgba(245,242,238,0.45)' }}>
                  Pick from Brain Dump…
                </option>
                {taskChips.slice(0, 5).map(chip => (
                  <option key={chip.id} value={chip.id} style={{ background: '#1A1728', color: 'rgba(245,242,238,0.95)' }}>
                    {chip.text}
                  </option>
                ))}
              </select>
            )}

            {/* New task input */}
            <input
              type="text"
              value={taskInput}
              onChange={e => { setTaskInput(e.target.value); setSelectedChipId(null) }}
              placeholder={taskChips.length > 0 ? 'Or add something new…' : 'What are you working on?'}
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 14,
                border: `1.5px solid ${taskInput ? 'rgba(244,165,130,0.4)' : D.border}`,
                background: D.surface,
                fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600,
                color: D.textPrimary, outline: 'none',
                caretColor: D.peach, marginBottom: 28,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(244,165,130,0.4)')}
              onBlur={e  => (e.target.style.borderColor = taskInput ? 'rgba(244,165,130,0.4)' : D.border)}
            />

          </>
        )}

        {/* Timer ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: state === 'idle' ? 32 : 32 }}>
          <div style={{
            position: 'relative', width: 240, height: 260,
            filter: celebrating ? 'drop-shadow(0 0 18px rgba(244,165,130,0.85)) drop-shadow(0 0 36px rgba(245,201,138,0.45))' : 'none',
            transition: 'filter 0.5s ease',
          }}>
            {state === 'idle' ? (
              <DraggableRing
                minutes={duration}
                onChange={m => { setDuration(m); setRemaining(m * 60) }}
              />
            ) : (
              <ProgressRing progress={progress} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontFamily: 'var(--font-aegora)',
                fontSize: state === 'done' ? '40px' : '54px', fontWeight: 900,
                color: state === 'done' ? D.peach : D.textPrimary,
                lineHeight: 1, letterSpacing: '-1px',
              }}>
                {state === 'done' ? '🎉' : state === 'idle' ? duration : formatTime(remaining)}
              </span>
              <span style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
                fontWeight: 500, color: D.textMuted, marginTop: 6,
              }}>
                {state === 'idle' ? 'MIN' : state === 'done' ? '' : state === 'paused' ? 'paused' : 'remaining'}
              </span>
            </div>
          </div>
        </div>

        {/* ── In-session content ── */}
        {inSession && (
          <>
            {/* Ambient sound */}
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
                letterSpacing: '0.1em', color: D.textFaint, marginBottom: 10,
              }}>
                AMBIENT SOUND
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {SOUNDS.map(s => {
                  const on = activeSound === s.key
                  return (
                    <button
                      key={s.key}
                      onClick={() => handleSoundSelect(s.key)}
                      style={{
                        flex: 1, padding: '11px 4px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${on ? 'rgba(244,165,130,0.45)' : D.border}`,
                        background: on ? 'rgba(244,165,130,0.1)' : D.surface,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 800,
                        color: on ? D.textPrimary : D.textMuted,
                        transition: 'all 0.15s',
                      }}
                    >
                      <SoundIcon type={s.key} active={on} />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Drop a thought — full width */}
            {state === 'active' && (
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={() => setShowCapture(true)}
                  style={{
                    width: '100%', padding: '13px 16px',
                    borderRadius: 14, border: `1.5px solid ${D.border}`,
                    background: D.surface, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 700,
                    color: D.textMuted,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a9 9 0 0 1 9 9c0 3.6-2.1 6.7-5.1 8.2L15 21H9l-.9-1.8A9 9 0 0 1 12 2z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <line x1="12" y1="8"  x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="15.5" r="0.8" fill="currentColor" />
                  </svg>
                  Drop a thought
                </button>
              </div>
            )}
          </>
        )}

        {/* DONE — Lumi message */}
        {state === 'done' && (
          <div style={{
            background: D.accentBg, border: `1.5px solid ${D.accentBorder}`,
            borderRadius: 16, padding: '16px 18px', marginBottom: 28,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, color: D.peach }}>✦</span>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '14px',
              fontWeight: 500, color: D.textPrimary, lineHeight: 1.5,
            }}>
              <span style={{ color: D.peach, fontWeight: 800 }}>Lumi: </span>
              {lumiMsg}
            </p>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state === 'idle'   && <button onClick={start}  style={primaryBtn}>Start session</button>}
          {state === 'active' && <>
            <button onClick={pause} style={primaryBtn}>Pause</button>
            <button onClick={end}   style={ghostBtn}>End early</button>
          </>}
          {state === 'paused' && <>
            <button onClick={resume} style={primaryBtn}>Resume</button>
            <button onClick={end}    style={ghostBtn}>End session</button>
          </>}
          {state === 'done'   && <button onClick={reset}  style={primaryBtn}>Start another</button>}
        </div>

        {/* ── Inline Lumi chat thread ── */}
        {(state === 'active' || state === 'paused') && bdMessages.length > 0 && (
          <div style={{ marginTop: 28 }}>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                  <defs>
                    <radialGradient id="lumiDot" cx="35%" cy="35%" r="65%">
                      <stop offset="0%"   stopColor="#F5C98A"/>
                      <stop offset="50%"  stopColor="#F4A582"/>
                      <stop offset="100%" stopColor="#E8A0BF"/>
                    </radialGradient>
                  </defs>
                  <circle cx="5" cy="5" r="4" fill="url(#lumiDot)"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: D.textFaint }}>
                  LUMI IS HERE
                </span>
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Messages */}
            <div
              ref={bdScrollRef}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}
            >
              {bdMessages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: 14,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                    borderBottomLeftRadius:  m.role === 'assistant' ? 4 : 14,
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, #F4A582, #F5C98A)'
                      : 'rgba(255,255,255,0.55)',
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
                    fontWeight: 500, lineHeight: 1.5,
                    color: m.role === 'user' ? '#1A1828' : D.textPrimary,
                  }}>
                    {m.content || (bdStreaming && m.role === 'assistant'
                      ? <span style={{ opacity: 0.4 }}>···</span>
                      : ''
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={bdInputRef}
                value={bdInput}
                onChange={e => setBdInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBdMessage() } }}
                placeholder="Reply to Lumi…"
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: D.textPrimary,
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600,
                  outline: 'none', caretColor: D.peach,
                }}
              />
              <button
                onClick={sendBdMessage}
                disabled={!bdInput.trim() || bdStreaming}
                style={{
                  width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: bdInput.trim() ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', flexShrink: 0,
                  opacity: bdInput.trim() && !bdStreaming ? 1 : 0.35,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke={bdInput.trim() ? '#1A1828' : D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Thought capture sheet ── */}
      {showCapture && (
        <>
          <div
            onClick={() => setShowCapture(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(10,9,20,0.7)',
              zIndex: 100, animation: 'lumiFadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '448px',
            background: '#242135',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            padding: '16px 20px 44px',
            zIndex: 101, animation: 'lumiSlideUp 0.28s ease',
          }}>
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              margin: '0 auto 20px',
            }} />

            <p style={{
              fontFamily: 'var(--font-aegora)', fontSize: '22px',
              fontWeight: 900, color: D.textPrimary, marginBottom: 4,
            }}>
              Drop a thought
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
              fontWeight: 500, color: D.textMuted, marginBottom: 16, lineHeight: 1.5,
            }}>
              Saved to Brain Dump. You can deal with it after your session.
            </p>

            <textarea
              value={thoughtText}
              onChange={e => setThoughtText(e.target.value)}
              autoFocus
              placeholder="What's pulling at your brain right now?"
              style={{
                width: '100%', minHeight: '96px',
                border: `1.5px solid ${D.border}`, borderRadius: 14,
                padding: '13px 14px',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', fontWeight: 600,
                color: D.textPrimary, lineHeight: 1.6,
                background: 'rgba(255,255,255,0.05)',
                outline: 'none', resize: 'none',
                boxSizing: 'border-box',
                caretColor: D.peach,
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(244,165,130,0.4)')}
              onBlur={e   => (e.target.style.borderColor = D.border)}
            />

            <button
              onClick={saveThought}
              disabled={!thoughtText.trim() || thoughtSaving}
              style={{
                ...primaryBtn,
                marginTop: 12,
                opacity: thoughtText.trim() && !thoughtSaving ? 1 : 0.45,
                background: thoughtSaved
                  ? 'linear-gradient(135deg, #5EC269, #7DD68A)'
                  : 'linear-gradient(135deg, #F4A582, #F5C98A)',
                transition: 'background 0.3s, opacity 0.2s',
              }}
            >
              {thoughtSaved ? '✓ Saved to Brain Dump' : thoughtSaving ? 'Saving…' : 'Save to Brain Dump'}
            </button>
          </div>
        </>
      )}


      <style>{`
        @keyframes sunBreathe {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.12); opacity: 0.82; }
        }
        @keyframes lumiFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lumiSlideUp {
          from { transform: translateX(-50%) translateY(100%) }
          to   { transform: translateX(-50%) translateY(0)    }
        }
        .chip-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      </div> {/* end content z-index wrapper */}
    </div>
  )
}
