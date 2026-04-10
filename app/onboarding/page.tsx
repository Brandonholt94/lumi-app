'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────
interface Message {
  id:      string
  role:    'lumi' | 'user'
  content: string
}

interface Answers {
  display_name:      string
  adhd_identity:     string
  biggest_struggle:  string
  hardest_time:      string
  support_situation: string
  tone_preference:   string
}

// ─── Flow ────────────────────────────────────────────────────
const STEPS = [
  {
    field:       'display_name' as keyof Answers,
    question:    "Hi, I'm Lumi. Before anything else — what should I call you?",
    type:        'text' as const,
    placeholder: 'Your name or nickname…',
    reaction:    (v: string) => `Really good to meet you, ${v}.`,
  },
  {
    field:    'adhd_identity' as keyof Answers,
    question: (name: string) => `How do you relate to ADHD, ${name}?`,
    type:     'choice' as const,
    options:  [
      { value: 'diagnosed',       label: 'Formally diagnosed' },
      { value: 'self-identified', label: 'Pretty sure I have it' },
      { value: 'exploring',       label: 'Still figuring it out' },
      { value: 'loved-one',       label: 'Supporting someone I love' },
    ],
    reaction: (v: string) => ({
      'diagnosed':       `Got it. I'll be direct with you — no tip-toeing around the ADHD stuff.`,
      'self-identified': `That self-awareness says a lot. You know yourself better than most.`,
      'exploring':       `That's okay. You don't need a diagnosis for any of this to be useful.`,
      'loved-one':       `That's a lot to carry too. I'll keep that in mind as we go.`,
    }[v] ?? `That helps me know where you're coming from.`),
  },
  {
    field:    'biggest_struggle' as keyof Answers,
    question: () => `What's the hardest part most days?`,
    type:     'choice' as const,
    options:  [
      { value: 'starting',   label: 'Getting started on things' },
      { value: 'time',       label: 'Losing track of time' },
      { value: 'overwhelm',  label: 'Feeling overwhelmed and shutting down' },
      { value: 'emotional',  label: 'Emotional spirals' },
      { value: 'forgetting', label: 'Forgetting things that matter' },
      { value: 'all',        label: 'Honestly? All of it' },
    ],
    reaction: (v: string) => ({
      'starting':   `The Wall of Awful is real. Starting is genuinely the hardest part — not a you problem.`,
      'time':       `Time blindness is one of the most misunderstood parts of ADHD. We'll work with that.`,
      'overwhelm':  `Shutdown is your brain's way of protecting itself. Not laziness — never laziness.`,
      'emotional':  `Those spirals are real and they hurt. I'll always lead with that.`,
      'forgetting': `That kind of forgetting is exhausting and embarrassing in ways people don't get. I get it.`,
      'all':        `Yeah. That's a lot to be carrying every day. Makes sense you're here.`,
    }[v] ?? `You're not alone in that. Not even a little.`),
  },
  {
    field:    'hardest_time' as keyof Answers,
    question: () => `When does your brain need the most backup?`,
    type:     'choice' as const,
    options:  [
      { value: 'morning',       label: 'Mornings — getting going' },
      { value: 'afternoon',     label: 'Afternoons — staying on track' },
      { value: 'evening',       label: 'Evenings — winding down' },
      { value: 'unpredictable', label: 'Whenever a spiral hits — no pattern' },
    ],
    reaction: (v: string) => ({
      'morning':       `Mornings are hard for a lot of ADHD brains. I'll be there early.`,
      'afternoon':     `That afternoon wall is real. I'll check in when it matters most.`,
      'evening':       `Winding down is its own kind of hard. I'll be there for that too.`,
      'unpredictable': `Got it — I won't assume. I'll follow your lead.`,
    }[v] ?? `Good to know. I'll keep that in mind.`),
  },
  {
    field:    'support_situation' as keyof Answers,
    question: () => `Are you getting any support right now?`,
    type:     'choice' as const,
    options:  [
      { value: 'therapist',  label: 'Yes — therapist or coach' },
      { value: 'medication', label: 'Yes — medication' },
      { value: 'waitlist',   label: 'No — on a waitlist' },
      { value: 'alone',      label: 'No — figuring it out alone' },
    ],
    reaction: (v: string) => ({
      'therapist':  `That's great. I'll work alongside that — think of me as the support between sessions.`,
      'medication':  `Good to know. I'm here for everything in between — the emotional stuff, the stuck moments, the hard days.`,
      'waitlist':   `Waitlists are brutal. I'll be here while you wait — all 167 hours a week that a therapist isn't.`,
      'alone':      `You don't have to figure this out by yourself anymore. That's what I'm here for.`,
    }[v] ?? `Got it. I'm here for whatever you need.`),
  },
  {
    field:    'tone_preference' as keyof Answers,
    question: () => `Last one — how do you want me to show up for you?`,
    type:     'choice' as const,
    options:  [
      { value: 'warm',     label: 'Warm and gentle' },
      { value: 'direct',   label: 'Direct and to the point' },
      { value: 'balanced', label: 'Somewhere in between' },
    ],
    reaction: (v: string) => ({
      'warm':     `Warm and gentle it is. No pressure, no rush.`,
      'direct':   `Direct it is. I'll skip the fluff and get to what matters.`,
      'balanced': `Balanced works. I'll read the room.`,
    }[v] ?? null),
  },
]

const uid = () => Math.random().toString(36).slice(2)

// ─── Styles ──────────────────────────────────────────────────
const PEACH = '#F4A582'
const GOLD  = '#F5C98A'
const DARK  = '#2D2A3E'
const BG    = '#FBF8F5'

export default function OnboardingPage() {
  const router = useRouter()

  const [messages,    setMessages]    = useState<Message[]>([])
  const [step,        setStep]        = useState(0)
  const [answers,     setAnswers]     = useState<Partial<Answers>>({})
  const [textInput,   setTextInput]   = useState('')
  const [isTyping,    setIsTyping]    = useState(false)
  const [done,        setDone]        = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [inputActive, setInputActive] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Push the first question on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setMessages([{ id: uid(), role: 'lumi', content: STEPS[0].question as string }])
    }, 400)
    return () => clearTimeout(t)
  }, [])

  const pushLumi = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: uid(), role: 'lumi', content: text }])
  }, [])

  async function advance(value: string, label: string) {
    const s = STEPS[step]
    const newAnswers = { ...answers, [s.field]: value }
    setAnswers(newAnswers)
    setTextInput('')

    // Add user bubble
    setMessages(prev => [...prev, { id: uid(), role: 'user', content: label }])

    const reactionText = typeof s.reaction === 'function' ? s.reaction(value) : null
    const nextStep = step + 1

    // Lumi typing indicator
    setIsTyping(true)
    await new Promise(r => setTimeout(r, 700))
    setIsTyping(false)

    if (reactionText) {
      pushLumi(reactionText)
      setIsTyping(true)
      await new Promise(r => setTimeout(r, 900))
      setIsTyping(false)
    }

    if (nextStep >= STEPS.length) {
      // All done — submit and show closing
      const name = newAnswers.display_name ?? ''
      pushLumi(`I've got you, ${name}. Whether it's getting started, staying afloat, or just having someone in your corner — I'm here all 167 hours a week.`)
      setDone(true)
      setSubmitting(true)
      setSaveError(null)
      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers),
        })
        if (!res.ok) {
          const body = await res.text()
          setSaveError(`Save failed (${res.status}): ${body}`)
        }
      } catch (e) {
        setSaveError(`Network error: ${e}`)
      } finally {
        setSubmitting(false)
      }
    } else {
      const nextQ = STEPS[nextStep].question
      const qText = typeof nextQ === 'function' ? nextQ(newAnswers.display_name ?? '') : nextQ
      pushLumi(qText)
      setStep(nextStep)
    }
  }

  const currentStep = STEPS[step]
  const progress    = done ? STEPS.length : step

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-nunito-sans)',
      overflowY: 'auto',
    }}>

      {/* Progress bar */}
      <div style={{ padding: '48px 24px 0', flexShrink: 0 }}>
        <div style={{
          height: 3, background: 'rgba(45,42,62,0.08)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${PEACH}, ${GOLD})`,
            width: `${(progress / STEPS.length) * 100}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Lumi avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(244,165,130,0.3)',
          fontSize: 18,
        }}>✦</div>
      </div>

      {/* Message thread — natural flow, no flex-1, so options follow messages */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 480, width: '100%', margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'lumiSlideIn 0.25s ease',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: msg.role === 'lumi'
                ? (i === 0 ? '4px 18px 18px 18px' : '18px 18px 18px 4px')
                : '18px 4px 18px 18px',
              background: msg.role === 'lumi' ? '#FFFFFF' : `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
              border: msg.role === 'lumi' ? '1px solid rgba(45,42,62,0.07)' : 'none',
              boxShadow: '0 1px 6px rgba(45,42,62,0.07)',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '15px', fontWeight: 600,
              color: msg.role === 'lumi' ? '#1E1C2E' : DARK,
              lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'lumiSlideIn 0.2s ease' }}>
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              background: '#FFFFFF', border: '1px solid rgba(45,42,62,0.07)',
              boxShadow: '0 1px 6px rgba(45,42,62,0.07)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'rgba(45,42,62,0.25)',
                  animation: `lumiDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Answer area */}
      <div style={{
        padding: '12px 20px 40px',
        maxWidth: 480, width: '100%', margin: '0 auto',
        boxSizing: 'border-box', flexShrink: 0,
      }}>
        {!isTyping && !done && (
          currentStep?.type === 'text' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && textInput.trim()) advance(textInput.trim(), textInput.trim()) }}
                onFocus={() => setInputActive(true)}
                onBlur={() => setInputActive(false)}
                placeholder="Your name or nickname…"
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 14, outline: 'none',
                  border: `1.5px solid ${inputActive ? 'rgba(244,165,130,0.5)' : 'rgba(45,42,62,0.12)'}`,
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', fontWeight: 600,
                  color: '#1E1C2E', background: '#FFFFFF', caretColor: PEACH,
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => textInput.trim() && advance(textInput.trim(), textInput.trim())}
                disabled={!textInput.trim()}
                style={{
                  padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: textInput.trim() ? `linear-gradient(135deg, ${PEACH}, ${GOLD})` : 'rgba(45,42,62,0.08)',
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 800,
                  color: textInput.trim() ? DARK : 'rgba(45,42,62,0.3)',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentStep?.options?.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => advance(opt.value, opt.label)}
                  style={{
                    width: '100%', padding: '13px 16px',
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    border: '1.5px solid rgba(45,42,62,0.10)',
                    background: '#FFFFFF',
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '14px', fontWeight: 600, color: DARK,
                    boxShadow: '0 1px 4px rgba(45,42,62,0.05)',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    const t = e.currentTarget
                    t.style.borderColor = 'rgba(244,165,130,0.5)'
                    t.style.background  = 'rgba(244,165,130,0.04)'
                  }}
                  onMouseLeave={e => {
                    const t = e.currentTarget
                    t.style.borderColor = 'rgba(45,42,62,0.10)'
                    t.style.background  = '#FFFFFF'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )
        )}

        {/* Save error */}
        {saveError && (
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
            fontWeight: 600, color: '#E05252', marginBottom: 8,
            padding: '10px 14px', background: 'rgba(224,82,82,0.08)',
            borderRadius: 10, lineHeight: 1.4,
          }}>
            {saveError}
          </p>
        )}

        {/* Done CTA */}
        {done && (
          <button
            onClick={() => {
              // Clear splash date so animation plays on first entry
              localStorage.removeItem('lumi_splash_date')
              // Hard navigation ensures layout server component gets fresh Supabase data
              window.location.href = '/welcome'
            }}
            disabled={submitting}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
              fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', fontWeight: 800,
              color: DARK, opacity: submitting ? 0.6 : 1,
              transition: 'opacity 0.2s',
              animation: 'lumiSlideIn 0.3s ease',
            }}
          >
            {submitting ? 'Setting things up…' : "Let's go →"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes lumiSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lumiDot {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.3; }
          30%            { transform: translateY(-4px); opacity: 1;   }
        }
        input::placeholder { color: rgba(122,120,144,0.55); }
      `}</style>
    </div>
  )
}
