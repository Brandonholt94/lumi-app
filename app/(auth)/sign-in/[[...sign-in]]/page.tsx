'use client'

import { useSignIn } from '@clerk/nextjs'
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

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9895B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#9895B0' }}>Back</span>
    </button>
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

type Phase = 'credentials' | 'forgot-email' | 'forgot-code'

export default function SignInPage() {
  const { signIn } = useSignIn()
  const router = useRouter()

  const [phase, setPhase]       = useState<Phase>('credentials')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [code, setCode]         = useState('')
  const [newPw, setNewPw]       = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    if (!signIn) return
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signIn.password({ identifier: email, password })
      if (err) { setError(clerkMsg(err)); setLoading(false); return }
      const { error: finalErr } = await signIn.finalize({
        navigate: ({ decorateUrl }) => { router.push(decorateUrl('/today')) },
      })
      if (finalErr) { setError(clerkMsg(finalErr)); setLoading(false); return }
    } catch (e: unknown) {
      setError(clerkMsg(e))
      setLoading(false)
    }
  }

  async function handleSendReset(e: FormEvent) {
    e.preventDefault()
    if (!signIn) return
    setError(null)
    setLoading(true)
    try {
      const { error: createErr } = await signIn.create({ identifier: email })
      if (createErr) { setError(clerkMsg(createErr)); setLoading(false); return }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode()
      if (sendErr) { setError(clerkMsg(sendErr)); setLoading(false); return }
      setPhase('forgot-code')
    } catch (e: unknown) {
      setError(clerkMsg(e))
    }
    setLoading(false)
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!signIn) return
    setError(null)
    setLoading(true)
    try {
      const { error: verifyErr } = await signIn.resetPasswordEmailCode.verifyCode({ code })
      if (verifyErr) { setError(clerkMsg(verifyErr)); setLoading(false); return }
      const { error: pwErr } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPw })
      if (pwErr) { setError(clerkMsg(pwErr)); setLoading(false); return }
      const { error: finalErr } = await signIn.finalize({
        navigate: ({ decorateUrl }) => { router.push(decorateUrl('/today')) },
      })
      if (finalErr) { setError(clerkMsg(finalErr)); setLoading(false); return }
    } catch (e: unknown) {
      setError(clerkMsg(e))
      setLoading(false)
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

        {/* ── Credentials ── */}
        {phase === 'credentials' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 900, color: '#1E1C2E', marginBottom: 4, lineHeight: 1.1 }}>
              Welcome back.
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 28 }}>
              Lumi missed you.
            </p>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={LABEL}>Email</label>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={INPUT} onFocus={focus} onBlur={blur} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...LABEL, marginBottom: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setError(null); setPhase('forgot-email') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-nunito-sans)', fontSize: 12, fontWeight: 700, color: '#F4A582', padding: 0 }}
                  >
                    Forgot?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...INPUT, paddingRight: 48 }} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={EYE_BTN}>
                    {showPw ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {error && <div style={ERROR_BOX}><p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72', margin: 0 }}>{error}</p></div>}

              <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        {/* ── Forgot: enter email ── */}
        {phase === 'forgot-email' && (
          <>
            <BackBtn onClick={() => { setPhase('credentials'); setError(null) }} />
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 900, color: '#1E1C2E', marginBottom: 4, lineHeight: 1.1 }}>
              Reset your password
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 28 }}>
              We'll send a reset code to your email.
            </p>

            <form onSubmit={handleSendReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={LABEL}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={INPUT} onFocus={focus} onBlur={blur} />
              </div>
              {error && <div style={ERROR_BOX}><p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72', margin: 0 }}>{error}</p></div>}
              <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          </>
        )}

        {/* ── Forgot: verify + new password ── */}
        {phase === 'forgot-code' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(244,165,130,0.15), rgba(245,201,138,0.15))', border: '1.5px solid rgba(244,165,130,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto' }}>
                ✉️
              </div>
            </div>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 900, color: '#1E1C2E', marginBottom: 4, lineHeight: 1.1, textAlign: 'center' }}>
              Check your email
            </h1>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0', marginBottom: 28, textAlign: 'center' }}>
              Code sent to <strong style={{ color: '#2D2A3E' }}>{email}</strong>
            </p>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={LABEL}>6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ ...INPUT, letterSpacing: '0.3em', textAlign: 'center', fontSize: 22, fontWeight: 800 }}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
              <div>
                <label style={LABEL}>New password</label>
                <input type="password" autoComplete="new-password" required value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Choose a new password" style={INPUT} onFocus={focus} onBlur={blur} />
              </div>
              {error && <div style={ERROR_BOX}><p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#B04E72', margin: 0 }}>{error}</p></div>}
              <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                {loading ? 'Updating password…' : 'Set new password'}
              </button>
              <button
                type="button"
                onClick={() => { setCode(''); setPhase('forgot-email'); setError(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 700, color: '#9895B0', padding: '4px 0', textAlign: 'center' }}
              >
                Resend code
              </button>
            </form>
          </>
        )}

      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontFamily: 'var(--font-nunito-sans)', fontSize: 13, fontWeight: 600, color: '#9895B0' }}>
        New to Lumi?{' '}
        <Link href="/sign-up" style={{ color: '#F4A582', fontWeight: 800, textDecoration: 'none' }}>
          Start free →
        </Link>
      </p>

    </div>
  )
}
