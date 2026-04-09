'use client'

import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    signOut(() => router.push('/sign-in'))
  }, [signOut, router])

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FBF8F5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lumi-wordmark-dark.svg" alt="Lumi" style={{ height: 28, opacity: 0.5 }} />
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 600,
        color: '#9895B0',
      }}>
        Signing you out...
      </p>
    </div>
  )
}
