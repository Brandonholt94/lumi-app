'use client'

import { useState } from 'react'
import Image from 'next/image'

// ── Brand tokens ──────────────────────────────────────────────
const PEACH  = '#F4A582'
const GOLD   = '#F5C98A'
const ROSE   = '#E8A0BF'
const DARK   = '#2D2A3E'
const DARKER = '#1E1C2E'
const MUTED  = '#7A7890'
const BG     = '#FBF8F5'

// ── Plan data ────────────────────────────────────────────────
type PlanKey = 'starter' | 'core' | 'companion'
type Billing = 'monthly' | 'annual'

const PLANS: Record<PlanKey, {
  name: string
  monthly: number
  annual: number
  annualTotal: number
  tagline: string
  features: string[]
  gradient: string
}> = {
  starter: {
    name: 'Starter',
    monthly: 7,
    annual: 4,
    annualTotal: 48,
    tagline: 'A gentle place to start',
    features: [
      'Lumi chat (20 messages/day)',
      'Brain Dump — unlimited captures',
      'Daily mood check-in',
      'One Focus task selection',
    ],
    gradient: `linear-gradient(135deg, ${GOLD}, ${PEACH})`,
  },
  core: {
    name: 'Core',
    monthly: 14,
    annual: 10,
    annualTotal: 120,
    tagline: 'Everything you need, every day',
    features: [
      'Unlimited Lumi chat',
      'Brain Dump — unlimited captures',
      'Focus sessions + full history',
      'Weekly Brain Report',
      'Mood & energy trends',
    ],
    gradient: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
  },
  companion: {
    name: 'Companion',
    monthly: 24,
    annual: 16,
    annualTotal: 192,
    tagline: 'Lumi at its fullest',
    features: [
      'Everything in Core',
      'Proactive nudges & check-ins',
      'RSD & burnout detection',
      'Hyperfocus recovery mode',
      'Priority AI responses',
    ],
    gradient: `linear-gradient(135deg, ${ROSE}, ${PEACH})`,
  },
}

const TESTIMONIALS = [
  {
    quote: "I've tried every planner app out there. Lumi is the first one that actually gets what it's like to have ADHD.",
    name: 'Mara T.',
    detail: 'Diagnosed at 34',
  },
  {
    quote: "It doesn't shame me when I fall off. It just helps me get back on. That's everything.",
    name: 'Devon K.',
    detail: 'ADHD + anxiety',
  },
  {
    quote: "The Brain Dump alone was worth it. I stopped losing track of everything that matters.",
    name: 'Simone R.',
    detail: 'Late-diagnosed ADHD',
  },
]

// ── Stars ────────────────────────────────────────────────────
function Stars() {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={PEACH}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

// ── Check icon ───────────────────────────────────────────────
function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" fill={`rgba(244,165,130,0.15)`}/>
      <path d="M8 12l3 3 5-5" stroke={PEACH} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function PlanSelectionPage() {
  const [plan, setPlan]       = useState<PlanKey>('core')
  const [billing, setBilling] = useState<Billing>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const selected  = PLANS[plan]
  const price     = billing === 'annual' ? selected.annual : selected.monthly
  const annualSaving = selected.monthly * 12 - selected.annualTotal

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey: `${plan}-${billing}` }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes lumiIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .plan-tab { transition: all 0.18s ease; }
        .plan-tab:active { transform: scale(0.97); }
        .billing-btn { transition: all 0.18s ease; }
      `}</style>

      <div style={{
        minHeight: '100dvh',
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(244,165,130,0.14) 0%, transparent 60%), ${BG}`,
        fontFamily: 'var(--font-nunito-sans)',
        paddingBottom: 120, // space for fixed bottom bar
      }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 52, paddingBottom: 24 }}>
          <Image src="/lumi-stacked.svg" alt="Lumi" width={72} height={72} priority />
        </div>

        <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 20px' }}>

          {/* ── Heading ── */}
          <div style={{ textAlign: 'center', marginBottom: 28, animation: 'lumiIn 0.4s ease both' }}>
            <h1 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 30, fontWeight: 900,
              color: DARKER, lineHeight: 1.15,
              marginBottom: 8,
            }}>
              Your brain deserves this.
            </h1>
            <p style={{ fontSize: 14, fontWeight: 600, color: MUTED, lineHeight: 1.5 }}>
              7 days free. No charge today. Cancel anytime.
            </p>
          </div>

          {/* ── Plan tabs ── */}
          <div style={{
            display: 'flex',
            background: 'white',
            borderRadius: 16,
            padding: 4,
            border: '1px solid rgba(45,42,62,0.08)',
            marginBottom: 16,
            gap: 4,
            animation: 'lumiIn 0.45s ease both',
          }}>
            {(['starter', 'core', 'companion'] as PlanKey[]).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className="plan-tab"
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: 13,
                  fontWeight: 800,
                  position: 'relative',
                  background: plan === p
                    ? `linear-gradient(135deg, ${PEACH}, ${GOLD})`
                    : 'transparent',
                  color: plan === p ? DARKER : MUTED,
                }}
              >
                {PLANS[p].name}
                {p === 'core' && plan !== 'core' && (
                  <span style={{
                    position: 'absolute', top: -7, right: 4,
                    background: ROSE, color: 'white',
                    fontSize: 8, fontWeight: 800,
                    padding: '2px 5px', borderRadius: 6,
                    letterSpacing: '0.03em',
                  }}>
                    ★
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Billing toggle ── */}
          <div style={{
            display: 'flex',
            background: 'white',
            borderRadius: 14,
            padding: 4,
            border: '1px solid rgba(45,42,62,0.08)',
            marginBottom: 24,
            gap: 4,
            animation: 'lumiIn 0.5s ease both',
          }}>
            {(['monthly', 'annual'] as Billing[]).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="billing-btn"
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: 13,
                  fontWeight: 800,
                  position: 'relative',
                  background: billing === b ? DARKER : 'transparent',
                  color: billing === b ? 'white' : MUTED,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
                {b === 'annual' && (
                  <span style={{
                    background: billing === 'annual' ? PEACH : `rgba(244,165,130,0.2)`,
                    color: billing === 'annual' ? DARKER : PEACH,
                    fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 6,
                    letterSpacing: '0.03em',
                  }}>
                    SAVE 35%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Price card ── */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px 22px',
            border: '1.5px solid rgba(244,165,130,0.25)',
            boxShadow: '0 4px 24px rgba(244,165,130,0.12)',
            marginBottom: 14,
            animation: 'lumiIn 0.55s ease both',
          }}>
            {/* Plan name + tagline */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 22, fontWeight: 900, color: DARKER,
                }}>
                  {selected.name}
                </span>
                {plan === 'core' && (
                  <span style={{
                    background: `linear-gradient(135deg, ${ROSE}, ${PEACH})`,
                    color: 'white', fontSize: 10, fontWeight: 800,
                    padding: '3px 9px', borderRadius: 20,
                    letterSpacing: '0.04em',
                  }}>
                    MOST POPULAR
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{selected.tagline}</p>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 48, fontWeight: 900, color: DARKER, lineHeight: 1 }}>
                  ${price}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: MUTED, paddingBottom: 6 }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>
                {billing === 'annual'
                  ? `Billed $${selected.annualTotal}/yr — you save $${annualSaving}`
                  : 'Billed monthly — switch to annual to save 35%'}
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: PEACH, marginTop: 4 }}>
                7 days free, then ${price}/mo
              </p>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Check />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#4A4760', lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: 'rgba(232,160,191,0.1)',
              border: '1px solid rgba(232,160,191,0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              fontSize: 13, fontWeight: 600, color: '#B04E72',
            }}>
              {error}
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0 24px',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(45,42,62,0.08)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(45,42,62,0.3)', letterSpacing: '0.06em' }}>
              WHAT OTHERS SAY
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(45,42,62,0.08)' }} />
          </div>

          {/* ── Testimonials ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 16,
                padding: '16px 18px',
                border: '1px solid rgba(45,42,62,0.07)',
                boxShadow: '0 1px 8px rgba(45,42,62,0.05)',
                animation: `lumiIn ${0.5 + i * 0.08}s ease both`,
              }}>
                <Stars />
                <p style={{
                  fontSize: 14, fontWeight: 600, color: '#3A3850',
                  lineHeight: 1.55, margin: '10px 0 8px',
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>
                  {t.name} · <span style={{ fontWeight: 600 }}>{t.detail}</span>
                </p>
              </div>
            ))}
          </div>

          {/* ── Fine print ── */}
          <p style={{
            fontSize: 11, fontWeight: 600, color: 'rgba(45,42,62,0.35)',
            textAlign: 'center', lineHeight: 1.6, marginTop: 8,
          }}>
            Secure checkout via Stripe.
            Cancel before your trial ends and you won&apos;t be charged.
          </p>
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: `linear-gradient(to top, ${BG} 70%, transparent)`,
        padding: '16px 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 50,
      }}>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            background: selected.gradient,
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: 16,
            fontWeight: 800,
            color: DARKER,
            boxShadow: '0 4px 20px rgba(244,165,130,0.35)',
            opacity: loading ? 0.75 : 1,
            transition: 'opacity 0.15s, transform 0.1s',
          }}
        >
          {loading ? 'Setting up your trial…' : 'Start 7-day free trial'}
        </button>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>
          No commitment. Cancel anytime.
        </p>
      </div>
    </>
  )
}
