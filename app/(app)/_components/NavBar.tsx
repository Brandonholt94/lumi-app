'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LumiTabIcon from './LumiTabIcon'

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8)
  }
}

type TabKey = 'today' | 'focus' | 'chat' | 'capture' | 'insights' | 'me'

export default function NavBar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')
  const [tapped, setTapped] = useState<TabKey | null>(null)

  function tap(key: TabKey) {
    haptic()
    setTapped(key)
    setTimeout(() => setTapped(null), 350)
  }

  const iconColor = (path: string) => is(path) ? '#F4A582' : 'rgba(45,42,62,0.26)'
  const iconScale = (path: string) => ({ transition: 'transform 0.2s ease', transform: is(path) ? 'scale(1.1)' : 'scale(1)' })

  return (
    <nav
      className="w-full flex-shrink-0 z-50"
      style={{ background: 'transparent', overflow: 'visible' }}
    >
      <style>{`
        @keyframes tabPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88); }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .tab-pop { animation: tabPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      <div
        className="flex items-end"
        style={{
          padding: '0 14px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          paddingTop: 8,
          gap: 10,
        }}
      >
        {/* ── Lumi — detached, floating left ── */}
        <Link
          href="/chat"
          className="flex-shrink-0"
          style={{ marginBottom: 2 }}
          onClick={() => tap('chat')}
        >
          <div className={tapped === 'chat' ? 'tab-pop' : ''}>
            <LumiTabIcon active={is('/chat')} />
          </div>
        </Link>

        {/* ── Tab pill ── */}
        <div
          className="flex items-center flex-1"
          style={{
            background: '#ffffff',
            borderRadius: 26,
            boxShadow: '0 4px 24px rgba(45,42,62,0.10), 0 1px 4px rgba(45,42,62,0.06)',
            padding: '5px 4px',
          }}
        >

          {/* Today */}
          <Link
            href="/today"
            className={`flex items-center justify-center flex-1 rounded-[20px] ${tapped === 'today' ? 'tab-pop' : ''}`}
            style={{ height: 44, background: is('/today') ? 'rgba(244,165,130,0.14)' : 'transparent', transition: 'background 0.2s' }}
            onClick={() => tap('today')}
          >
            <svg width="22" height="22" viewBox="0 0 256 256" style={iconScale('/today')}>
              <path fill={iconColor('/today')} style={{ transition: 'fill 0.2s' }}
                d="M208,28H188V24a12,12,0,0,0-24,0v4H92V24a12,12,0,0,0-24,0v4H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28ZM68,52a12,12,0,0,0,24,0h72a12,12,0,0,0,24,0h16V76H52V52ZM52,204V100H204V204Zm92-76a16,16,0,1,1-16-16A16,16,0,0,1,144,128Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,128ZM96,176a16,16,0,1,1-16-16A16,16,0,0,1,96,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,144,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,176Z"
              />
            </svg>
          </Link>

          {/* Focus */}
          <Link
            href="/focus"
            className={`flex items-center justify-center flex-1 rounded-[20px] ${tapped === 'focus' ? 'tab-pop' : ''}`}
            style={{ height: 44, background: is('/focus') ? 'rgba(244,165,130,0.14)' : 'transparent', transition: 'background 0.2s' }}
            onClick={() => tap('focus')}
          >
            <svg width="22" height="22" viewBox="0 0 256 256" style={iconScale('/focus')}>
              <path fill={iconColor('/focus')} style={{ transition: 'fill 0.2s' }}
                d="M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z"
              />
            </svg>
          </Link>

          {/* Brain Dump */}
          <Link
            href="/capture"
            className={`flex items-center justify-center flex-1 rounded-[20px] ${tapped === 'capture' ? 'tab-pop' : ''}`}
            style={{ height: 44, background: is('/capture') ? 'rgba(244,165,130,0.14)' : 'transparent', transition: 'background 0.2s' }}
            onClick={() => tap('capture')}
          >
            <svg width="22" height="22" viewBox="0 0 256 256" style={iconScale('/capture')}>
              <path fill={iconColor('/capture')} style={{ transition: 'fill 0.2s' }}
                d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"
              />
            </svg>
          </Link>

          {/* Insights */}
          <Link
            href="/insights"
            className={`flex items-center justify-center flex-1 rounded-[20px] ${tapped === 'insights' ? 'tab-pop' : ''}`}
            style={{ height: 44, background: is('/insights') ? 'rgba(244,165,130,0.14)' : 'transparent', transition: 'background 0.2s' }}
            onClick={() => tap('insights')}
          >
            <svg width="22" height="22" viewBox="0 0 256 256" style={iconScale('/insights')}>
              <path fill={iconColor('/insights')} style={{ transition: 'fill 0.2s' }}
                d="M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z"
              />
            </svg>
          </Link>

          {/* Me / Profile */}
          <Link
            href="/me"
            className={`flex items-center justify-center flex-1 rounded-[20px] ${tapped === 'me' ? 'tab-pop' : ''}`}
            style={{ height: 44, background: is('/me') ? 'rgba(244,165,130,0.14)' : 'transparent', transition: 'background 0.2s' }}
            onClick={() => tap('me')}
          >
            <svg width="22" height="22" viewBox="0 0 256 256" style={iconScale('/me')}>
              <path fill={iconColor('/me')} style={{ transition: 'fill 0.2s' }}
                d="M128,120a44,44,0,1,0-44-44A44.05,44.05,0,0,0,128,120Zm0-72a20,20,0,1,1-20,20A20,20,0,0,1,128,48ZM216,208a8,8,0,0,1-16,0,72,72,0,0,0-144,0,8,8,0,0,1-16,0,88,88,0,0,1,176,0Z"
              />
            </svg>
          </Link>

        </div>
      </div>
    </nav>
  )
}
