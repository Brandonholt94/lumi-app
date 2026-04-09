'use client'

import Link from 'next/link'

// Simple inline profile icon — drop this into any page header
export default function ProfileButton() {
  return (
    <Link
      href="/me"
      aria-label="Profile"
      style={{ display: 'block', borderRadius: '50%', flexShrink: 0 }}
      className="active:scale-90 transition-transform"
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#AEAEB2',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style={{ marginBottom: -2 }}>
          <circle cx="14" cy="10" r="5" fill="white" />
          <path d="M4 26c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="white" />
        </svg>
      </div>
    </Link>
  )
}
