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

type TabKey = 'today' | 'focus' | 'chat' | 'capture' | 'insights'

export default function NavBar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')
  const [tapped, setTapped] = useState<TabKey | null>(null)

  function tap(key: TabKey) {
    haptic()
    setTapped(key)
    setTimeout(() => setTapped(null), 350)
  }

  return (
    <nav
      className="w-full flex-shrink-0 z-50"
      style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(45,42,62,0.08)',
        overflow: 'visible',
      }}
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

      <div className="relative flex items-center justify-around px-1 pt-2" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Today */}
        <Link href="/today" className="flex flex-col items-center gap-1 flex-1" onClick={() => tap('today')}>
          <div
            className={`flex items-center justify-center w-11 h-8 rounded-2xl ${tapped === 'today' ? 'tab-pop' : ''}`}
            style={{
              background: is('/today') ? 'rgba(244,165,130,0.15)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 256 256"
              style={{ transition: 'transform 0.2s ease', transform: is('/today') ? 'scale(1.08)' : 'scale(1)' }}>
              <path
                fill={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                style={{ transition: 'fill 0.2s ease' }}
                d="M208,28H188V24a12,12,0,0,0-24,0v4H92V24a12,12,0,0,0-24,0v4H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28ZM68,52a12,12,0,0,0,24,0h72a12,12,0,0,0,24,0h16V76H52V52ZM52,204V100H204V204Zm92-76a16,16,0,1,1-16-16A16,16,0,0,1,144,128Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,128ZM96,176a16,16,0,1,1-16-16A16,16,0,0,1,96,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,144,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,176Z"
              />
            </svg>
          </div>
          <span
            className="text-[10px] font-bold"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              color: is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)',
              transition: 'color 0.2s ease',
            }}
          >
            Today
          </span>
        </Link>

        {/* Focus */}
        <Link href="/focus" className="flex flex-col items-center gap-1 flex-1" onClick={() => tap('focus')}>
          <div
            className={`flex items-center justify-center w-11 h-8 rounded-2xl ${tapped === 'focus' ? 'tab-pop' : ''}`}
            style={{
              background: is('/focus') ? 'rgba(244,165,130,0.15)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 256 256"
              style={{ transition: 'transform 0.2s ease', transform: is('/focus') ? 'scale(1.08)' : 'scale(1)' }}>
              <path
                fill={is('/focus') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                style={{ transition: 'fill 0.2s ease' }}
                d="M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z"
              />
            </svg>
          </div>
          <span
            className="text-[10px] font-bold"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              color: is('/focus') ? '#F4A582' : 'rgba(45,42,62,0.28)',
              transition: 'color 0.2s ease',
            }}
          >
            Focus
          </span>
        </Link>

        {/* Lumi — floats above nav */}
        <Link href="/chat" className="flex flex-col items-center gap-1 flex-1 -mt-4" onClick={() => tap('chat')}>
          <div className={tapped === 'chat' ? 'tab-pop' : ''}>
            <LumiTabIcon />
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: '#F4A582' }}>
            Lumi
          </span>
        </Link>

        {/* Brain Dump */}
        <Link href="/capture" className="flex flex-col items-center gap-1 flex-1" onClick={() => tap('capture')}>
          <div
            className={`flex items-center justify-center w-11 h-8 rounded-2xl ${tapped === 'capture' ? 'tab-pop' : ''}`}
            style={{
              background: is('/capture') ? 'rgba(244,165,130,0.15)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 256 256"
              style={{ transition: 'transform 0.2s ease', transform: is('/capture') ? 'scale(1.08)' : 'scale(1)' }}>
              <path
                fill={is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                style={{ transition: 'fill 0.2s ease' }}
                d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"
              />
            </svg>
          </div>
          <span
            className="text-[10px] font-bold"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              color: is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)',
              transition: 'color 0.2s ease',
            }}
          >
            Brain Dump
          </span>
        </Link>

        {/* Insights */}
        <Link href="/insights" className="flex flex-col items-center gap-1 flex-1" onClick={() => tap('insights')}>
          <div
            className={`flex items-center justify-center w-11 h-8 rounded-2xl ${tapped === 'insights' ? 'tab-pop' : ''}`}
            style={{
              background: is('/insights') ? 'rgba(244,165,130,0.15)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 256 256"
              style={{ transition: 'transform 0.2s ease', transform: is('/insights') ? 'scale(1.08)' : 'scale(1)' }}>
              <path
                fill={is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                style={{ transition: 'fill 0.2s ease' }}
                d="M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z"
              />
            </svg>
          </div>
          <span
            className="text-[10px] font-bold"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              color: is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)',
              transition: 'color 0.2s ease',
            }}
          >
            Insights
          </span>
        </Link>

      </div>
    </nav>
  )
}
