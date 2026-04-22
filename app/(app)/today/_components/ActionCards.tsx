'use client'

import { useEffect, useState } from 'react'

type CardId = 'notifications' | 'calendar' | 'app'

interface CardDef {
  id:          CardId
  title:       string
  description: string
  href?:       string
  actionLabel: string
  color:       string       // tint hex
  icon:        React.ReactNode
}

// ── Animated icons ────────────────────────────────────────────

const BellIcon = () => (
  <>
    <style>{`
      @keyframes lumiRing {
        0%,100% { transform: rotate(0deg);   }
        10%      { transform: rotate(-18deg); }
        20%      { transform: rotate(18deg);  }
        30%      { transform: rotate(-12deg); }
        40%      { transform: rotate(12deg);  }
        50%      { transform: rotate(0deg);   }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none"
      style={{ animation: 'lumiRing 3s ease-in-out infinite', transformOrigin: '50% 10%' }}>
      <path fill="#F4A582" d="M225.81,74.65A11.86,11.86,0,0,1,220.3,76a12,12,0,0,1-10.67-6.47,90.1,90.1,0,0,0-32-35.38,12,12,0,1,1,12.8-20.29,115.25,115.25,0,0,1,40.54,44.62A12,12,0,0,1,225.81,74.65ZM46.37,69.53a90.1,90.1,0,0,1,32-35.38A12,12,0,1,0,65.6,13.86,115.25,115.25,0,0,0,25.06,58.48a12,12,0,0,0,5.13,16.17A11.86,11.86,0,0,0,35.7,76,12,12,0,0,0,46.37,69.53Zm173.51,98.35A20,20,0,0,1,204,200H171.81a44,44,0,0,1-87.62,0H52a20,20,0,0,1-15.91-32.12c7.17-9.33,15.73-26.62,15.88-55.94A76,76,0,0,1,204,112C204.15,141.26,212.71,158.55,219.88,167.88ZM147.6,200H108.4a20,20,0,0,0,39.2,0Zm48.74-24c-8.16-13-16.19-33.57-16.34-63.94A52,52,0,1,0,76,112c-.15,30.42-8.18,51-16.34,64Z"/>
    </svg>
  </>
)

const CalendarIcon = () => (
  <>
    <style>{`
      @keyframes lumiHandSweep {
        from { transform: rotate(0deg);   }
        to   { transform: rotate(360deg); }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="22" stroke="#8FAAE0" strokeWidth="5"/>
      <line x1="28" y1="28" x2="28" y2="12" stroke="#8FAAE0" strokeWidth="4" strokeLinecap="round"
        style={{ transformOrigin: '28px 28px', animation: 'lumiHandSweep 6s linear infinite' }}/>
      <line x1="28" y1="28" x2="38" y2="34" stroke="#8FAAE0" strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: '28px 28px', animation: 'lumiHandSweep 0.5s linear infinite' }}/>
      <circle cx="28" cy="28" r="3" fill="#8FAAE0"/>
    </svg>
  </>
)

const PhoneIcon = () => (
  <>
    <style>{`
      @keyframes lumiPhoneBounce {
        0%,100% { transform: translateY(0px) rotate(0deg);  }
        20%      { transform: translateY(-4px) rotate(-6deg); }
        40%      { transform: translateY(0px) rotate(0deg);  }
        60%      { transform: translateY(-2px) rotate(4deg); }
        80%      { transform: translateY(0px) rotate(0deg);  }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none"
      style={{ animation: 'lumiPhoneBounce 4s ease-in-out infinite' }}>
      <path fill="#E8A0BF" d="M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16Zm8,200a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8Zm-56-24a12,12,0,1,1-12-12A12,12,0,0,1,128,192Z"/>
    </svg>
  </>
)

// ── Dismiss storage — resets every 7 days ─────────────────────

const STORAGE_KEY = 'lumi_action_cards'

function getWeekKey() {
  return `w${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`
}

function loadDismissed(): Set<CardId> {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const data = JSON.parse(raw)
    if (data.week !== getWeekKey()) return new Set() // reset weekly
    return new Set(data.dismissed as CardId[])
  } catch { return new Set() }
}

function saveDismissed(dismissed: Set<CardId>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      week: getWeekKey(),
      dismissed: [...dismissed],
    }))
  } catch {}
}

// ── Component ─────────────────────────────────────────────────

export default function ActionCards() {
  const [dismissed,         setDismissed]        = useState<Set<CardId>>(new Set())
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [notifGranted,      setNotifGranted]      = useState<boolean>(true)
  const [ready,             setReady]             = useState(false)

  useEffect(() => {
    setDismissed(loadDismissed())

    if (typeof Notification !== 'undefined') {
      setNotifGranted(Notification.permission === 'granted')
    }

    fetch('/api/calendar/status')
      .then(r => r.json())
      .then(data => {
        const anyConnected = !!(data.google?.connected || data.microsoft?.connected)
        setCalendarConnected(anyConnected)
      })
      .catch(() => setCalendarConnected(false))
      .finally(() => setReady(true))
  }, [])

  function dismiss(id: CardId) {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  // Build card list in priority order
  const ALL_CARDS: CardDef[] = [
    {
      id:          'notifications',
      title:       'Stay in sync',
      description: 'Get gentle nudges from Lumi',
      actionLabel: 'Turn on',
      color:       '#F4A582',
      href:        '/me/notifications',
      icon:        <BellIcon />,
    },
    {
      id:          'calendar',
      title:       'Connect calendar',
      description: 'Lumi sees what\'s coming up',
      actionLabel: 'Connect',
      color:       '#8FAAE0',
      href:        '/me/calendar',
      icon:        <CalendarIcon />,
    },
    {
      id:          'app',
      title:       'Get the app',
      description: 'Lumi on your phone, always',
      actionLabel: 'Download',
      color:       '#E8A0BF',
      href:        'https://apps.apple.com',
      icon:        <PhoneIcon />,
    },
  ]

  if (!ready) return null

  // Filter out dismissed + cards that are already done
  const visible = ALL_CARDS.filter(card => {
    if (dismissed.has(card.id))                           return false
    if (card.id === 'notifications' && notifGranted)      return false
    if (card.id === 'calendar'      && calendarConnected) return false
    return true
  }).slice(0, 3)

  if (visible.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily:    'var(--font-nunito-sans)',
        fontSize:      '10px',
        fontWeight:    800,
        letterSpacing: '0.1em',
        color:         '#9895B0',
        marginBottom:  10,
      }}>
        SUGGESTED
      </p>

      <div style={{
        display:         'flex',
        gap:             12,
        overflowX:       'auto',
        scrollbarWidth:  'none',
        paddingBottom:   4,
      }}>
        {visible.map(card => (
          <div
            key={card.id}
            style={{
              flexShrink:   0,
              width:        148,
              background:   'white',
              borderRadius: 20,
              border:       '1.5px solid rgba(45,42,62,0.07)',
              padding:      '16px 14px 14px',
              position:     'relative',
              boxShadow:    '0 2px 8px rgba(45,42,62,0.06)',
            }}
          >
            {/* Dismiss X */}
            <button
              onClick={() => dismiss(card.id)}
              style={{
                position:   'absolute',
                top:        10,
                right:      10,
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    2,
                color:      'rgba(45,42,62,0.25)',
                lineHeight: 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Animated icon */}
            <div style={{
              width:          44,
              height:         44,
              borderRadius:   13,
              background:     `${card.color}22`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              marginBottom:   12,
            }}>
              {card.icon}
            </div>

            {/* Text */}
            <p style={{
              fontFamily: 'var(--font-aegora)',
              fontSize:   14,
              fontWeight: 700,
              color:      '#1E1C2E',
              marginBottom: 4,
              lineHeight: 1.2,
              paddingRight: 8,
            }}>
              {card.title}
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize:   11,
              fontWeight: 500,
              color:      '#9895B0',
              lineHeight: 1.4,
              marginBottom: 14,
            }}>
              {card.description}
            </p>

            {/* CTA */}
            {card.href && (
              <a
                href={card.href}
                style={{
                  display:        'inline-block',
                  padding:        '6px 12px',
                  borderRadius:   8,
                  background:     `${card.color}22`,
                  fontFamily:     'var(--font-nunito-sans)',
                  fontSize:       11,
                  fontWeight:     800,
                  color:          card.color,
                  textDecoration: 'none',
                  border:         `1.5px solid ${card.color}44`,
                }}
              >
                {card.actionLabel}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
