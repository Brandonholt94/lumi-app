'use client'

import { useEffect, useState } from 'react'
import ProfileButton from '../../_components/ProfileButton'

interface Props {
  firstName: string
}

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 12) return { text: 'Morning', emoji: '🌅' }
  if (hour < 17) return { text: 'Afternoon', emoji: '☀️' }
  if (hour < 21) return { text: 'Evening', emoji: '🌆' }
  return { text: 'Evening', emoji: '🌙' }
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function GreetingHeader({ firstName }: Props) {
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null)
  const [date, setDate] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(getGreeting(hour))
    setDate(getFormattedDate())
  }, [])

  return (
    <div style={{ background: '#ffffff', padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '26px',
              fontWeight: 900,
              color: '#1E1C2E',
              lineHeight: 1.1,
              marginBottom: 3,
            }}
          >
            {greeting ? (
              <>
                {greeting.emoji} {greeting.text},{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #F4A582, #F5C98A, #8FAAE0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {firstName}.
                </span>
              </>
            ) : (
              /* Prevent layout shift — invisible placeholder */
              <span style={{ opacity: 0 }}>· {firstName}.</span>
            )}
          </h1>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#9895B0',
          }}>
            {date || '\u00A0'} · Let&apos;s find your one thing.
          </p>
        </div>
        <ProfileButton />
      </div>
    </div>
  )
}
