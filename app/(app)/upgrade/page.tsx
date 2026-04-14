'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PEACH  = '#F4A582'
const GOLD   = '#F5C98A'
const ROSE   = '#E8A0BF'
const DARK   = '#2D2A3E'
const DARKER = '#1E1C2E'
const MUTED  = '#7A7890'

type BillingCycle = 'monthly' | 'annual'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    monthly: 7,
    annual: 4,
    annualTotal: 48,
    description: 'A gentle place to begin',
    features: [
      'Lumi chat (20 messages/day)',
      'Brain Dump (unlimited)',
      'Daily mood check-in',
      'One Focus task',
    ],
    cta: 'Start 7-day free trial',
    gradient: `linear-gradient(135deg, ${GOLD}, ${PEACH})`,
    popular: false,
  },
  {
    key: 'core',
    name: 'Core',
    monthly: 14,
    annual: 10,
    annualTotal: 120,
    description: 'Everything you need to stay on track',
    features: [
      'Unlimited Lumi chat',
      'Unlimited Brain Dump',
      'Focus sessions + history',
      'Weekly Brain Report',
      'Mood + energy trends',
    ],
    cta: 'Start 7-day free trial',
    gradient: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
    popular: false,
  },
  {
    key: 'companion',
    name: 'Companion',
    monthly: 24,
    annual: 16,
    annualTotal: 192,
    description: 'Lumi at its fullest',
    features: [
      'Everything in Core',
      'Proactive nudges + check-ins',
      'RSD + burnout detection',
      'Hyperfocus recovery mode',
      'Priority AI responses',
    ],
    cta: 'Start 7-day free trial',
    gradient: `linear-gradient(135deg, ${ROSE}, ${PEACH})`,
    popular: true,
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleUpgrade(planKey: string) {
    const priceKey = `${planKey}-${billing}`
    setLoading(planKey)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '28px 20px 40px',
      fontFamily: 'var(--font-nunito-sans)',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: MUTED, fontSize: '14px', fontWeight: 600,
            padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '28px', fontWeight: 900,
          color: DARKER, marginBottom: 8,
        }}>
          Upgrade Lumi
        </h1>
        <p style={{ fontSize: '15px', color: MUTED, fontWeight: 500, lineHeight: 1.5 }}>
          7-day free trial on all plans. Cancel anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'white', borderRadius: 12,
        padding: '4px', marginBottom: 24,
        border: '1px solid rgba(45,42,62,0.08)',
        width: 'fit-content',
      }}>
        {(['monthly', 'annual'] as BillingCycle[]).map(cycle => (
          <button
            key={cycle}
            onClick={() => setBilling(cycle)}
            style={{
              padding: '8px 20px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700,
              fontFamily: 'var(--font-nunito-sans)',
              background: billing === cycle
                ? `linear-gradient(135deg, ${PEACH}, ${GOLD})`
                : 'transparent',
              color: billing === cycle ? DARKER : MUTED,
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            {cycle === 'annual' && (
              <span style={{
                position: 'absolute', top: -8, right: -4,
                background: ROSE, color: 'white',
                fontSize: '9px', fontWeight: 800,
                padding: '2px 5px', borderRadius: 6,
                letterSpacing: '0.02em',
              }}>
                SAVE 35%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {checkoutError && (
        <div style={{
          background: 'rgba(232,160,191,0.1)', border: '1px solid rgba(232,160,191,0.3)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72',
        }}>
          {checkoutError}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PLANS.map(plan => {
          const price = billing === 'annual' ? plan.annual : plan.monthly
          const isLoading = loading === plan.key

          return (
            <div
              key={plan.key}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: '20px 20px',
                border: plan.popular
                  ? `2px solid ${PEACH}`
                  : '1px solid rgba(45,42,62,0.08)',
                boxShadow: plan.popular
                  ? `0 4px 24px rgba(244,165,130,0.18)`
                  : '0 1px 8px rgba(45,42,62,0.06)',
                position: 'relative',
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: 20,
                  background: `linear-gradient(135deg, ${ROSE}, ${PEACH})`,
                  color: 'white', fontSize: '11px', fontWeight: 800,
                  padding: '4px 12px', borderRadius: 20,
                  letterSpacing: '0.04em',
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: '20px', fontWeight: 900,
                    color: DARKER, marginBottom: 3,
                  }}>
                    {plan.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: MUTED, fontWeight: 500 }}>
                    {plan.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: DARKER }}>${price}</span>
                  <span style={{ fontSize: '13px', color: MUTED, fontWeight: 500 }}>/mo</span>
                  {billing === 'annual' && (
                    <p style={{ fontSize: '11px', color: MUTED, fontWeight: 500, marginTop: 2 }}>
                      billed ${plan.annualTotal}/yr
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: PEACH, fontSize: '14px', flexShrink: 0, marginTop: 1 }}>✦</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4A4760', lineHeight: 1.4 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.cta && (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={!!loading}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
                    background: plan.gradient!,
                    fontFamily: 'var(--font-nunito-sans)',
                    fontSize: '15px', fontWeight: 800,
                    color: DARKER, textAlign: 'center',
                    boxShadow: '0 3px 14px rgba(244,165,130,0.3)',
                    opacity: loading && !isLoading ? 0.6 : 1,
                    transition: 'opacity 0.2s, transform 0.15s',
                  }}
                >
                  {isLoading ? 'Redirecting…' : plan.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p style={{
        fontSize: '12px', color: MUTED, fontWeight: 500,
        textAlign: 'center', marginTop: 24, lineHeight: 1.6,
      }}>
        Secure checkout via Stripe. Cancel anytime from your account settings.
      </p>
    </div>
  )
}
