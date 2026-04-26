'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PEACH  = '#F4A582'
const GOLD   = '#F5C98A'
const DARKER = '#1E1C2E'
const MUTED  = '#9895B0'

interface DoctorInfo {
  doctor_name:  string
  doctor_email: string
}

export default function DoctorReportPage() {
  const router = useRouter()
  const [info, setInfo]       = useState<DoctorInfo>({ doctor_name: '', doctor_email: '' })
  const [saving, setSaving]   = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [plan, setPlan]         = useState<string>('core')
  const [syncing, setSyncing]   = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setInfo({
          doctor_name:  d.doctor_name  ?? '',
          doctor_email: d.doctor_email ?? '',
        })
        setPlan((d.plan ?? 'core').toLowerCase())
        setLoading(false)
      })
      .catch(() => {
        setPlan('companion') // fail open — real auth enforced by /api/doctor-report
        setLoading(false)
      })
  }, [])

  async function saveContact() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_name:  info.doctor_name.trim(),
        doctor_email: info.doctor_email.trim(),
      }),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
    else setError('Could not save. Try again.')
  }

  async function sendReport() {
    if (!info.doctor_email.trim()) {
      setError('Add your doctor\'s email first.')
      return
    }
    setSending(true)
    setSent(false)
    setError(null)
    const res = await fetch('/api/doctor-report', { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Could not send report. Try again.')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>

      {/* Breadcrumb header */}
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(45,42,62,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/me" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: MUTED }}>Profile</span>
        </Link>
        <svg width="10" height="10" viewBox="0 0 256 256" fill="#C4C1D4">
          <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: '#2D2A3E' }}>Doctor report</span>
      </div>

      <div className="lumi-me-content" style={{ paddingTop: 28, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-aegora)',
          fontSize: '26px', fontWeight: 500,
          color: DARKER, marginBottom: 6,
        }}>
          Doctor Report
        </h1>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '14px', fontWeight: 500,
          color: MUTED, lineHeight: 1.55,
        }}>
          Send a secure summary of your mood, sleep, focus, and habit data directly to your psychiatrist or prescriber.
        </p>
      </div>

      {/* Upgrade prompt for non-Companion users */}
      {!loading && plan !== 'companion' && (
        <div style={{
          background:   'linear-gradient(135deg, rgba(244,165,130,0.14) 0%, rgba(245,201,138,0.12) 100%)',
          border:       '1.5px solid rgba(244,165,130,0.28)',
          borderRadius: 20,
          padding:      '28px 22px',
          marginBottom: 24,
          textAlign:    'center',
        }}>
          <p style={{
            fontFamily:    'var(--font-aegora)',
            fontSize:      '20px',
            fontWeight: 500,
            color:         DARKER,
            marginBottom:  10,
            lineHeight:    1.3,
          }}>
            Doctor reports are a Companion feature
          </p>
          <p style={{
            fontFamily:  'var(--font-nunito-sans)',
            fontSize:    '14px',
            fontWeight:  500,
            color:       MUTED,
            lineHeight:  1.6,
            marginBottom: 20,
          }}>
            Upgrade to Companion to generate and send professional health summaries directly to your prescriber.
          </p>
          <a
            href="/upgrade"
            style={{
              display:        'inline-block',
              padding:        '13px 28px',
              borderRadius:   14,
              background:     `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
              fontFamily:     'var(--font-nunito-sans)',
              fontSize:       '14px',
              fontWeight:     800,
              color:          DARKER,
              textDecoration: 'none',
              boxShadow:      '0 3px 14px rgba(244,165,130,0.30)',
            }}
          >
            Upgrade to Companion
          </a>
          <p style={{ marginTop: 16, marginBottom: 0 }}>
            <button
              onClick={async () => {
                setSyncing(true)
                try {
                  const res = await fetch('/api/profile/sync-plan', { method: 'POST' })
                  const d = await res.json()
                  if (d.plan) setPlan(d.plan.toLowerCase())
                } finally {
                  setSyncing(false)
                }
              }}
              disabled={syncing}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '12px', fontWeight: 600,
                color: MUTED, textDecoration: 'underline',
                padding: 0,
              }}
            >
              {syncing ? 'Checking…' : 'Already on Companion? Refresh your plan'}
            </button>
          </p>
        </div>
      )}

      {/* What's included */}
      <div style={{
        background: 'rgba(244,165,130,0.07)',
        border: '1.5px solid rgba(244,165,130,0.20)',
        borderRadius: 16, padding: '16px 18px',
        marginBottom: 24,
      }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px', fontWeight: 800,
          letterSpacing: '0.1em', color: MUTED,
          marginBottom: 10,
        }}>
          WHAT&apos;S INCLUDED (LAST 30 DAYS)
        </p>
        {[
          '📊 Average mood score + most common mood',
          '💤 Average sleep hours + nights logged',
          '🎯 Focus sessions completed + total time',
          '✅ Habit check-in frequency',
          '💊 Medications on file (self-reported)',
        ].map((item, i) => (
          <p key={i} style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px', fontWeight: 500,
            color: DARKER, lineHeight: 1.5,
            marginBottom: i < 4 ? 6 : 0,
          }}>
            {item}
          </p>
        ))}
      </div>

      {/* Doctor contact + send — Companion only */}
      {!loading && plan === 'companion' && (
        <>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px', fontWeight: 800,
            letterSpacing: '0.1em', color: MUTED,
            marginBottom: 10,
          }}>
            YOUR DOCTOR&apos;S CONTACT
          </p>

          {loading ? (
            <div style={{ height: 44, borderRadius: 12, background: 'rgba(45,42,62,0.06)', marginBottom: 12 }} />
          ) : (
            <>
              <input
                value={info.doctor_name}
                onChange={e => setInfo(p => ({ ...p, doctor_name: e.target.value }))}
                placeholder="Dr. Sarah Chen"
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  marginBottom: 10, padding: '12px 14px',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px', fontWeight: 600, color: DARKER,
                  background: 'white', border: '1.5px solid rgba(45,42,62,0.10)',
                  borderRadius: 12, outline: 'none',
                }}
              />
              <input
                value={info.doctor_email}
                onChange={e => setInfo(p => ({ ...p, doctor_email: e.target.value }))}
                placeholder="doctor@practice.com"
                type="email"
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  marginBottom: 14, padding: '12px 14px',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '14px', fontWeight: 600, color: DARKER,
                  background: 'white', border: '1.5px solid rgba(45,42,62,0.10)',
                  borderRadius: 12, outline: 'none',
                }}
              />
              <button
                onClick={saveContact}
                disabled={saving}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: 12, border: 'none',
                  background: saved
                    ? 'rgba(94,194,105,0.15)'
                    : 'rgba(45,42,62,0.06)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-nunito-sans)',
                  fontSize: '13px', fontWeight: 800,
                  color: saved ? '#4A9A55' : MUTED,
                  marginBottom: 28,
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Saving…' : saved ? '✓ Contact saved' : 'Save contact'}
              </button>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(200,64,64,0.08)',
              border: '1px solid rgba(200,64,64,0.20)',
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 16,
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '13px', fontWeight: 600,
              color: '#C84040',
            }}>
              {error}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={sendReport}
            disabled={sending || !info.doctor_email.trim()}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 16, border: 'none',
              cursor: sending || !info.doctor_email.trim() ? 'not-allowed' : 'pointer',
              background: sent
                ? 'rgba(94,194,105,0.15)'
                : `linear-gradient(135deg, ${PEACH}, ${GOLD})`,
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '15px', fontWeight: 800,
              color: sent ? '#4A9A55' : DARKER,
              boxShadow: sent ? 'none' : '0 3px 14px rgba(244,165,130,0.30)',
              opacity: (!info.doctor_email.trim() && !sent) ? 0.5 : 1,
              transition: 'all 0.2s',
              marginBottom: 12,
            }}
          >
            {sending ? 'Sending report…' : sent ? '✓ Report sent to your doctor' : `Send report to ${info.doctor_name || 'my doctor'}`}
          </button>

          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '11px', fontWeight: 500,
            color: MUTED, textAlign: 'center',
            lineHeight: 1.6,
          }}>
            Report is sent via secure email. Your doctor receives a professional summary — not your raw conversations.
          </p>
        </>
      )}
      </div>{/* end lumi-me-content */}
    </div>
  )
}
