'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import MeHeader from '../_components/MeHeader'

export default function EditProfilePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync once user loads
  if (isLoaded && !firstName && user?.firstName) {
    setFirstName(user.firstName)
    setLastName(user.lastName ?? '')
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() })
      setSaved(true)
      setTimeout(() => router.push('/me'), 800)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 32 }}>

      <MeHeader title="Edit name" />

      <div className="px-5">

        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
            marginBottom: 8,
            paddingLeft: 4,
          }}>
            FIRST NAME
          </label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="First name"
            style={{
              width: '100%',
              background: 'white',
              borderRadius: 12,
              border: '1px solid rgba(45,42,62,0.1)',
              padding: '14px 16px',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1E1C2E',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
            marginBottom: 8,
            paddingLeft: 4,
          }}>
            LAST NAME
          </label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Last name"
            style={{
              width: '100%',
              background: 'white',
              borderRadius: 12,
              border: '1px solid rgba(45,42,62,0.1)',
              padding: '14px 16px',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1E1C2E',
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved || !firstName.trim()}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: saved
              ? '#5A9F7A'
              : 'linear-gradient(135deg, #F4A582, #F5C98A)',
            border: 'none',
            cursor: saving || !firstName.trim() ? 'not-allowed' : 'pointer',
            opacity: !firstName.trim() ? 0.5 : 1,
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: saved ? 'white' : '#1E1C2E',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save changes'}
        </button>

        <p style={{
          marginTop: 16,
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 600,
          color: '#9895B0',
        }}>
          This is how Lumi will greet you
        </p>

      </div>
    </div>
  )
}
