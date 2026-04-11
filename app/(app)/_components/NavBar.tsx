'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LumiTabIcon from './LumiTabIcon'

export default function NavBar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')
  const today = new Date().getDate()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50"
      style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(45,42,62,0.08)',
        overflow: 'visible',
      }}
    >
      <div className="relative flex items-center justify-around px-1 pt-2" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Today */}
        <Link href="/today" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/today') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2.5"
                stroke={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                strokeWidth="1.8" fill="none"
              />
              <line x1="3" y1="10" x2="21" y2="10"
                stroke={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                strokeWidth="1.8"
              />
              <line x1="8"  y1="3" x2="8"  y2="7" stroke={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="16" y1="3" x2="16" y2="7" stroke={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="1.8" strokeLinecap="round"/>
              <text
                x="12" y="19.5"
                textAnchor="middle"
                fontSize="7"
                fontWeight="800"
                fontFamily="var(--font-nunito-sans)"
                fill={is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
              >{today}</text>
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/today') ? '#F4A582' : 'rgba(45,42,62,0.28)' }}>
            Today
          </span>
        </Link>

        {/* Focus */}
        <Link href="/focus" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/focus') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={is('/focus') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="2" />
              <path d="M12 7V12L15 15" stroke={is('/focus') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/focus') ? '#F4A582' : 'rgba(45,42,62,0.28)' }}>
            Focus
          </span>
        </Link>

        {/* Lumi — floats above nav, Acorns-style */}
        <Link href="/chat" className="flex flex-col items-center gap-1 flex-1 -mt-4">
          <LumiTabIcon />
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: '#F4A582' }}>
            Lumi
          </span>
        </Link>

        {/* Brain Dump */}
        <Link href="/capture" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/capture') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9.5 2C7 2 5 4 5 6.5c0 .98.32 1.88.85 2.62C4.73 9.9 4 11.1 4 12.5 4 14.43 5.3 16.05 7 16.5V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.5c1.7-.45 3-2.07 3-4 0-1.4-.73-2.6-1.85-3.38C18.68 8.38 19 7.48 19 6.5 19 4 17 2 14.5 2c-.93 0-1.8.28-2.5.75A4.47 4.47 0 0 0 9.5 2Z"
                stroke={is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)'}
                strokeWidth="1.8" strokeLinejoin="round" fill="none"
              />
              <line x1="9" y1="12" x2="9" y2="16" stroke={is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="11" x2="12" y2="16" stroke={is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="15" y1="12" x2="15" y2="16" stroke={is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)'} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/capture') ? '#F4A582' : 'rgba(45,42,62,0.28)' }}>
            Brain Dump
          </span>
        </Link>

        {/* Insights */}
        <Link href="/insights" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/insights') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4"  y="14" width="3" height="7" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)'} />
              <rect x="10" y="9"  width="3" height="12" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)'} />
              <rect x="16" y="4"  width="3" height="17" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)'} />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/insights') ? '#F4A582' : 'rgba(45,42,62,0.28)' }}>
            Insights
          </span>
        </Link>

      </div>
    </nav>
  )
}
