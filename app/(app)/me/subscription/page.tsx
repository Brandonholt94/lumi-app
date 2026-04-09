import Link from 'next/link'
import MeHeader from '../_components/MeHeader'

function PlanFeature({ text, included = true }: { text: string; included?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: included ? 'linear-gradient(135deg, #F4A582, #F5C98A)' : 'rgba(45,42,62,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}>
        {included ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="#1E1C2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M2 2L6 6M6 2L2 6" stroke="#9895B0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </span>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 600,
        color: included ? '#2D2A3E' : '#9895B0',
        lineHeight: 1.4,
      }}>
        {text}
      </span>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Your plan" />

      <div className="px-5">

        {/* Current plan badge */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          padding: '20px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#9895B0',
              marginBottom: 4,
            }}>
              CURRENT PLAN
            </p>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '22px',
              fontWeight: 900,
              color: '#1E1C2E',
            }}>
              Free
            </p>
          </div>
          <span style={{
            background: 'rgba(45,42,62,0.06)',
            borderRadius: 100,
            padding: '6px 14px',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 800,
            color: '#9895B0',
          }}>
            Active
          </span>
        </div>

        {/* Upgrade card */}
        <div style={{
          background: 'linear-gradient(135deg, #1E1C2E 0%, #2D2A3E 100%)',
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,165,130,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'rgba(244,165,130,0.7)',
            marginBottom: 6,
          }}>
            LUMI CORE
          </p>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '26px',
            fontWeight: 900,
            color: 'white',
            marginBottom: 2,
          }}>
            $29<span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>/mo</span>
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 20,
          }}>
            Or $19/mo billed annually · 7-day free trial
          </p>

          <div style={{ marginBottom: 24 }}>
            <PlanFeature text="Unlimited AI conversations with Lumi" />
            <PlanFeature text="Cross-session memory — Lumi remembers you" />
            <PlanFeature text="Mood tracking + pattern insights" />
            <PlanFeature text="Weekly Brain Report" />
            <PlanFeature text="Medication reminders" />
            <PlanFeature text="Priority support" />
          </div>

          <button style={{
            width: '100%',
            padding: '15px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: '#1E1C2E',
          }}>
            Start 7-day free trial
          </button>
        </div>

        {/* Companion teaser */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          padding: '18px 20px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '17px',
              fontWeight: 700,
              color: '#1E1C2E',
            }}>
              Lumi Companion
            </p>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px',
              fontWeight: 800,
              color: '#2D2A3E',
            }}>
              $69/mo
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#9895B0',
            lineHeight: 1.5,
          }}>
            Everything in Core, plus voice mode, therapist-letter summaries, and priority routing for crisis support.
          </p>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Cancel anytime. No punishment, no guilt trip.{'\n'}That&apos;s the Lumi way.
        </p>

      </div>
    </div>
  )
}
