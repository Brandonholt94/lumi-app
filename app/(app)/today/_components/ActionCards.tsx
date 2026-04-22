'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CardId = 'notifications' | 'calendar' | 'sleep' | 'focus' | 'braindump'

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

const MoonIcon = () => (
  <>
    <style>{`
      @keyframes lumiMoonPulse {
        0%,100% { opacity: 1;   transform: scale(1);    }
        50%      { opacity: 0.6; transform: scale(0.88); }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none"
      style={{ animation: 'lumiMoonPulse 3s ease-in-out infinite' }}>
      <path fill="#9895B0" d="M244,96a12,12,0,0,1-12,12H220v12a12,12,0,0,1-24,0V108H184a12,12,0,0,1,0-24h12V72a12,12,0,0,1,24,0V84h12A12,12,0,0,1,244,96ZM144,60h4v4a12,12,0,0,0,24,0V60h4a12,12,0,0,0,0-24h-4V32a12,12,0,0,0-24,0v4h-4a12,12,0,0,0,0,24Zm75.81,90.38A12,12,0,0,1,222,162.3,100,100,0,1,1,93.7,34a12,12,0,0,1,15.89,13.6A85.12,85.12,0,0,0,108,64a84.09,84.09,0,0,0,84,84,85.22,85.22,0,0,0,16.37-1.59A12,12,0,0,1,219.81,150.38ZM190,172A108.13,108.13,0,0,1,84,66,76,76,0,1,0,190,172Z"/>
    </svg>
  </>
)

const SparkIcon = () => (
  <>
    <style>{`
      @keyframes lumiSparkSpin {
        from { transform: rotate(0deg);   }
        to   { transform: rotate(360deg); }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none"
      style={{ animation: 'lumiSparkSpin 8s linear infinite' }}>
      <path fill="#F5C98A" d="M199,125.31l-49.88-18.39L130.69,57a19.92,19.92,0,0,0-37.38,0L74.92,106.92,25,125.31a19.92,19.92,0,0,0,0,37.38l49.88,18.39L93.31,231a19.92,19.92,0,0,0,37.38,0l18.39-49.88L199,162.69a19.92,19.92,0,0,0,0-37.38Zm-63.38,35.16a12,12,0,0,0-7.11,7.11L112,212.28l-16.47-44.7a12,12,0,0,0-7.11-7.11L43.72,144l44.7-16.47a12,12,0,0,0,7.11-7.11L112,75.72l16.47,44.7a12,12,0,0,0,7.11,7.11L180.28,144Z"/>
    </svg>
  </>
)

const CloudIcon = () => (
  <>
    <style>{`
      @keyframes lumiFloat {
        0%,100% { transform: translateY(0px);  }
        50%      { transform: translateY(-5px); }
      }
    `}</style>
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none"
      style={{ animation: 'lumiFloat 3s ease-in-out infinite' }}>
      <path fill="#E8A0BF" d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Z"/>
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
  const [dismissed,         setDismissed]         = useState<Set<CardId>>(new Set())
  const [calendarConnected, setCalendarConnected]  = useState<boolean | null>(null)
  const [notifGranted,      setNotifGranted]       = useState<boolean>(true)
  const [sleepLoggedToday,  setSleepLoggedToday]   = useState<boolean>(false)
  const [hasTasks,          setHasTasks]           = useState<boolean>(false)
  const [hasCaptures,       setHasCaptures]        = useState<boolean>(false)
  const [ready,             setReady]              = useState(false)

  useEffect(() => {
    setDismissed(loadDismissed())

    if (typeof Notification !== 'undefined') {
      setNotifGranted(Notification.permission === 'granted')
    }

    const tzOffset = new Date().getTimezoneOffset()

    Promise.all([
      fetch('/api/calendar/status').then(r => r.json()).catch(() => ({ connected: false })),
      fetch(`/api/sleep?tzOffset=${tzOffset}`).then(r => r.json()).catch(() => ({ today: null })),
      fetch('/api/captures').then(r => r.json()).catch(() => []),
    ]).then(([cal, sleep, captures]) => {
      setCalendarConnected(cal.connected ?? false)
      setSleepLoggedToday(!!sleep.today)
      const list = Array.isArray(captures) ? captures : []
      setHasTasks(list.some((c: { tag: string }) => c.tag === 'task' || c.tag === 'reminder'))
      setHasCaptures(list.length > 2)
    }).finally(() => setReady(true))
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
      id:          'sleep',
      title:       'Log your sleep',
      description: 'Lumi adjusts to how you slept',
      actionLabel: 'Log it',
      color:       '#9895B0',
      href:        '/me/sleep',
      icon:        <MoonIcon />,
    },
    {
      id:          'focus',
      title:       'Set one focus',
      description: 'What\'s the one thing today?',
      actionLabel: 'Set focus',
      color:       '#F5C98A',
      href:        '/capture',
      icon:        <SparkIcon />,
    },
    {
      id:          'braindump',
      title:       'Brain dump',
      description: 'Clear your head in seconds',
      actionLabel: 'Open',
      color:       '#E8A0BF',
      href:        '/capture',
      icon:        <CloudIcon />,
    },
  ]

  if (!ready) return null

  // Filter out dismissed + cards that don't apply
  const visible = ALL_CARDS.filter(card => {
    if (dismissed.has(card.id))                           return false
    if (card.id === 'notifications' && notifGranted)      return false
    if (card.id === 'calendar'      && calendarConnected) return false
    if (card.id === 'sleep'         && sleepLoggedToday)  return false
    if (card.id === 'focus'         && hasTasks)          return false
    if (card.id === 'braindump'     && hasCaptures)       return false
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
              fontFamily: 'var(--font-fraunces)',
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
