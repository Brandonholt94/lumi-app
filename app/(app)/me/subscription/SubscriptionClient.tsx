'use client'

import { useState } from 'react'

const PEACH = '#F4A582'
const GOLD  = '#F5C98A'
const ROSE  = '#E8A0BF'
const DARK  = '#2D2A3E'
const DARKER = '#1E1C2E'
const MUTED  = '#9895B0'

type Plan = 'free' | 'core' | 'companion'
type BillingCycle = 'monthly' | 'annual'

const PLAN_LABELS: Record<Plan, string> = {
  free:      'Free',
  core:      'Core',
  companion: 'Companion',
}

function PlanFeature({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4 7L8 3" stroke="#1E1C2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: '14px',
        fontWeight: 600, color: DARK, lineHeight: 1.4,
      }}>
        {text}
      </span>
    </div>
  )
}

export default function SubscriptionClient({ currentPlan }: { currentPlan: Plan }) {
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planKey: string) {
    const priceKey = `${planKey}-${billing}`
    setLoading(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  const isPaid = currentPlan !== 'free'

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* Current plan */}
      <div style={{
        background: 'white', borderRadius: 16,
        border: '1px solid rgba(45,42,62,0.07)',
        padding: '20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
            fontWeight: 800, letterSpacing: '0.1em', color: MUTED, marginBottom: 4,
          }}>CURRENT PLAN</p>
          <p style={{
            fontFamily: 'var(--font-fraunces)', fontSize: '22px',
            fontWeight: 900, color: DARKER,
          }}>
            {PLAN_LABELS[currentPlan]}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{
            background: isPaid
              ? `linear-gradient(135deg, ${PEACH}, ${GOLD})`
              : 'rgba(45,42,62,0.06)',
            borderRadius: 100, padding: '6px 14px',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
            fontWeight: 800,
            color: isPaid ? DARKER : MUTED,
          }}>
            Active
          </span>
          {isPaid && (
            <button
              onClick={handleManage}
              disabled={!!loading}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
                fontWeight: 700, color: MUTED, textDecoration: 'underline',
              }}
            >
              {loading === 'portal' ? 'Opening…' : 'Manage / Cancel'}
            </button>
          )}
        </div>
      </div>

      {/* Only show upgrade options if not on Companion */}
      {currentPlan !== 'companion' && (
        <>
          {/* Billing toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'white', borderRadius: 12,
            padding: '4px', marginBottom: 20,
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
                  }}>
                    SAVE 35%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Core upgrade card */}
          {currentPlan === 'free' && (
            <div style={{
              background: `linear-gradient(135deg, ${DARKER} 0%, ${DARK} 100%)`,
              borderRadius: 20, padding: '24px 20px',
              marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 140, height: 140, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(244,165,130,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
                fontWeight: 800, letterSpacing: '0.1em',
                color: 'rgba(244,165,130,0.7)', marginBottom: 6,
              }}>LUMI CORE</p>
              <p style={{
                fontFamily: 'var(--font-fraunces)', fontSize: '26px',
                fontWeight: 900, color: 'white', marginBottom: 2,
              }}>
                {billing === 'annual' ? '$19' : '$29'}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>/mo</span>
              </p>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
                fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 20,
              }}>
                {billing === 'annual' ? 'Billed annually · ' : ''}7-day free trial
              </p>
              <div style={{ marginBottom: 24 }}>
                <PlanFeature text="Unlimited Lumi chat" />
                <PlanFeature text="Unlimited Brain Dump" />
                <PlanFeature text="Focus sessions + history" />
                <PlanFeature text="Weekly Brain Report" />
                <PlanFeature text="Mood + energy trends" />
              </div>
              <button
                onClick={() => handleUpgrade('core')}
                disabled={!!loading}
                style={{
                  width: '100%', padding: '15px', borderRadius: 12,
                  background: `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
                  border: 'none', cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '15px',
                  fontWeight: 800, color: DARKER,
                  opacity: loading && loading !== 'core' ? 0.6 : 1,
                }}
              >
                {loading === 'core' ? 'Redirecting…' : 'Start 7-day free trial'}
              </button>
            </div>
          )}

          {/* Companion card */}
          <div style={{
            background: 'white', borderRadius: 16,
            border: `1px solid rgba(232,160,191,0.3)`,
            padding: '20px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-fraunces)', fontSize: '18px',
                  fontWeight: 900, color: DARKER, marginBottom: 3,
                }}>Companion</p>
                <p style={{
                  fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
                  fontWeight: 600, color: MUTED,
                }}>Lumi at its fullest</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: DARKER }}>
                  {billing === 'annual' ? '$42' : '$69'}
                </span>
                <span style={{ fontSize: '13px', color: MUTED, fontWeight: 600 }}>/mo</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <PlanFeature text="Everything in Core" />
              <PlanFeature text="Proactive nudges + check-ins" />
              <PlanFeature text="RSD + burnout detection" />
              <PlanFeature text="Hyperfocus recovery mode" />
              <PlanFeature text="Priority AI responses" />
            </div>
            <button
              onClick={() => handleUpgrade('companion')}
              disabled={!!loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: `linear-gradient(135deg, ${ROSE}, ${PEACH})`,
                border: 'none', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '15px',
                fontWeight: 800, color: DARKER,
                opacity: loading && loading !== 'companion' ? 0.6 : 1,
              }}
            >
              {loading === 'companion' ? 'Redirecting…' : 'Start 7-day free trial'}
            </button>
          </div>
        </>
      )}

      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-nunito-sans)',
        fontSize: '11px', fontWeight: 600,
        color: 'rgba(45,42,62,0.3)', lineHeight: 1.6,
      }}>
        Secure checkout via Stripe. Cancel anytime.{'\n'}No punishment, no guilt trip. That&apos;s the Lumi way.
      </p>
    </div>
  )
}
