'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, FormEvent, CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Shared style tokens ───────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  border: '1.5px solid rgba(45,42,62,0.12)',
  borderRadius: 12,
  background: '#F7F4F0',
  fontFamily: 'var(--font-nunito-sans)',
  fontSize: 15,
  fontWeight: 600,
  color: '#1E1C2E',
  outline: 'none',
  transition: 'border-color 0.18s',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
}

const LABEL: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-nunito-sans)',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  color: '#9895B0',
  marginBottom: 6,
  textTransform: 'uppercase',
}

const BTN_PRIMARY: CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
  border: 'none',
  borderRadius: 14,
  fontFamily: 'var(--font-nunito-sans)',
  fontSize: 15,
  fontWeight: 800,
  color: '#1E1C2E',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  transition: 'opacity 0.15s',
}

const ERROR_BOX: CSSProperties = {
  background: 'rgba(232,160,191,0.1)',
  border: '1px solid rgba(232,160,191,0.3)',
  borderRadius: 10,
  padding: '10px 14px',
}

const EYE_BTN: CSSProperties = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#9895B0',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
}

// ── Icons ─────────────────────────────────────────────────

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────

function clerkMsg(err: unknown): string {
  if (!err) return ''
  const e = err as { longMessage?: string; message?: string }
  return e.longMessage ?? e.message ?? 'Something went wrong. Try again.'
}

function focus(e: React.FocusEvent<HTMLInputElement>) { e.target.style.borderColor = '#F4A582' }
function blur(e: React.FocusEvent<HTMLInputElement>) { e.target.style.borderColor = 'rgba(45,42,62,0.12)' }

// ── Page ─────────────────────────────────────────────────

type Phase = 'form' | 'verify'

export default function SignUpPage() {
  const { signUp } = useSignUp()
  const router = useRouter()

  const [phase, setPhase]       = useState<Phase>('form')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [code, setCode]         = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [resent, setResent]     = useState(false)

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    if (!signUp) return
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signUp.password({ emailAddress: email, password })
      if (err) { setError(clerkMsg(err)); setLoading(false); return }
      const { error: sendErr } = await signUp.verifications.sendEmailCode()
      if (sendErr) { setError(clerkMsg(sendErr)); setLoading(false); return }
      setPhase('verify')
    } catch (e: unknown) {
      setError(clerkMsg(e))
    }
    setLoading(false)
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!signUp) return
    setError(null)
    setLoading(true)
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code })
      if (verifyErr) { setError(clerkMsg(verifyErr)); setLoading(false); return }
      if (signUp.status !== 'complete') {
        setError('Verification failed. Please try again.')
        setLoading(false)
        return
      }
      const { error: finalErr } = await signUp.finalize()
      if (finalErr) { setError(clerkMsg(finalErr)); setLoading(false); return }
      router.push('/onboarding')
    } catch (e: unknown) {
      setError(clerkMsg(e))
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!signUp) return
    try {
      await signUp.verifications.sendEmailCode()
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {
      // silently fail
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% -5%, rgba(244,165,130,0.12) 0%, transparent 55%), #FBF8F5',
      padding: '24px 20px',
    }}>

      {/* Stacked logo */}
      <Link href="https://lumimind.app" style={{ marginBottom: 28, display: 'block' }}>
        <Image src="/lumi-stacked.svg" alt="Lumi" width={118} height={118} priority />
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#FFFFFF',
        borderRadius: 24,
        border: '1px solid rgba(45,42,62,0.06)',
        boxShadow: '0 8px 40px rgba(45,42,62,0.08), 0 1px 4px rgba(45,42,62,0.04)',
        padding: '32px 28px',
      }}>

        {/* ── Form phase ── */}
        {phase === 'form' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 900, color: '#1E1C2E', marginBottom: 4, lineHeight: 1.1 }}>
              A new day for your brain.
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 28 }}>
              7 days free. No credit card needed.
            </p>

            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={LABEL}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={INPUT}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>

              <div>
                <label style={LABEL}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8+ characters"
                    style={{ ...INPUT, paddingRight: 48 }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={EYE_BTN}>
                    {showPw ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={ERROR_BOX}>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72', margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                {loading ? 'Creating account…' : 'Create free account'}
              </button>

              <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 11, fontWeight: 600, color: '#B0ADBE', textAlign: 'center', margin: 0 }}>
                By continuing you agree to our{' '}
                <a href="https://lumimind.app/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#9895B0', textDecoration: 'underline' }}>Terms</a>
                {' '}and{' '}
                <a href="https://lumimind.app/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#9895B0', textDecoration: 'underline' }}>Privacy Policy</a>.
              </p>
            </form>
          </>
        )}

        {/* ── Verify phase ── */}
        {phase === 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(244,165,130,0.15), rgba(245,201,138,0.15))',
                border: '1.5px solid rgba(244,165,130,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, margin: '0 auto',
              }}>
                ✉️
              </div>
            </div>

            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 900, color: '#1E1C2E', marginBottom: 6, lineHeight: 1.1, textAlign: 'center' }}>
              Check your email
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 28, textAlign: 'center', lineHeight: 1.5 }}>
              We sent a code to{' '}
              <strong style={{ color: '#2D2A3E', fontWeight: 800 }}>{email}</strong>
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ ...LABEL, textAlign: 'center' }}>Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ ...INPUT, letterSpacing: '0.35em', textAlign: 'center', fontSize: 24, fontWeight: 800, padding: '14px 16px' }}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>

              {error && (
                <div style={ERROR_BOX}>
                  <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72', margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700,
                  color: resent ? '#5EC269' : '#9895B0',
                  padding: '4px 0', textAlign: 'center', transition: 'color 0.2s',
                }}
              >
                {resent ? '✓ Code resent' : 'Resend code'}
              </button>
            </form>
          </>
        )}

      </div>

      {/* Footer */}
      {phase === 'form' && (
        <p style={{ marginTop: 24, fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0' }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: '#F4A582', fontWeight: 800, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      )}

    </div>
  )
}
