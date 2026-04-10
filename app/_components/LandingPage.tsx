'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes lumiRise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lumi-cta:active { transform: scale(0.98); }
      `}</style>

      {/* Full-screen container */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-nunito-sans)',
      }}>

        {/* ── Background photo ── */}
        <Image
          src="/sunrise.jpg"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
        />

        {/* ── Warm overlay — softens and unifies the photo ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(139,170,224,0.15) 0%, rgba(251,248,245,0.08) 40%, rgba(244,165,130,0.22) 100%)',
        }} />

        {/* ── Mobile layout: bottom glass panel ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>

          {/* Logo — floats top-left */}
          <div style={{
            position: 'absolute',
            top: 52, left: 24,
            animation: 'lumiRise 0.6s ease both',
          }}>
            <Image src="/lumi-wordmark-dark.svg" alt="Lumi" width={90} height={32} priority />
          </div>

          {/* Glass panel */}
          <div style={{
            background: 'rgba(251,248,245,0.78)',
            backdropFilter: 'blur(28px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
            borderTop: '1px solid rgba(255,255,255,0.7)',
            borderRadius: '28px 28px 0 0',
            padding: '32px 24px',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
            animation: 'lumiRise 0.5s ease 0.1s both',
          }}>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 28, fontWeight: 900,
              color: '#1E1C2E',
              lineHeight: 1.2,
              marginBottom: 6,
            }}>
              A new day for your brain.
            </h1>
            <p style={{
              fontSize: 14, fontWeight: 600,
              color: '#7A7890',
              lineHeight: 1.5,
              marginBottom: 28,
            }}>
              7 days free. No credit card needed.
            </p>

            {/* Sign up CTA */}
            <Link
              href="/sign-up"
              className="lumi-cta"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: 16, fontWeight: 800,
                color: '#1E1C2E',
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(244,165,130,0.4)',
                marginBottom: 12,
                boxSizing: 'border-box',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
            >
              Get started free
            </Link>

            {/* Sign in link */}
            <p style={{
              textAlign: 'center',
              fontSize: 14, fontWeight: 600,
              color: '#7A7890',
              margin: 0,
            }}>
              Already have an account?{' '}
              <Link href="/sign-in" style={{
                color: '#F4A582', fontWeight: 800, textDecoration: 'none',
              }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* ── Desktop: left glass panel ── */}
        <style>{`
          @media (min-width: 768px) {
            .lumi-mobile-panel { display: none !important; }
            .lumi-desktop-panel { display: flex !important; }
          }
          @media (max-width: 767px) {
            .lumi-desktop-panel { display: none !important; }
          }
        `}</style>

        {/* Desktop panel — hidden on mobile via class above */}
        <div
          className="lumi-desktop-panel"
          style={{
            display: 'none',
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            padding: '0 0 0 60px',
          }}
        >
          <div style={{
            width: 420,
            background: 'rgba(251,248,245,0.82)',
            backdropFilter: 'blur(32px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.75)',
            borderRadius: 28,
            padding: '44px 40px',
            boxShadow: '0 8px 48px rgba(45,42,62,0.12)',
            animation: 'lumiRise 0.6s ease both',
          }}>

            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
              <Image src="/lumi-wordmark-dark.svg" alt="Lumi" width={100} height={36} priority />
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 36, fontWeight: 900,
              color: '#1E1C2E',
              lineHeight: 1.15,
              marginBottom: 8,
            }}>
              A new day for<br />your brain.
            </h1>
            <p style={{
              fontSize: 15, fontWeight: 600,
              color: '#7A7890',
              lineHeight: 1.5,
              marginBottom: 36,
            }}>
              7 days free. No credit card needed.
            </p>

            {/* CTA */}
            <Link
              href="/sign-up"
              className="lumi-cta"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: 16, fontWeight: 800,
                color: '#1E1C2E',
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(244,165,130,0.4)',
                marginBottom: 16,
                boxSizing: 'border-box',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
            >
              Get started free
            </Link>

            <p style={{
              textAlign: 'center',
              fontSize: 14, fontWeight: 600,
              color: '#7A7890',
              margin: 0,
            }}>
              Already have an account?{' '}
              <Link href="/sign-in" style={{
                color: '#F4A582', fontWeight: 800, textDecoration: 'none',
              }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
