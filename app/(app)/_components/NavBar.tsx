'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50"
      style={{ background: '#1E1C2E', overflow: 'visible' }}
    >
      <div className="relative flex items-center justify-around px-1 pt-3 pb-7">

        {/* Today */}
        <Link href="/today" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/today') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2.5"
                stroke={is('/today') ? '#F4A582' : 'rgba(255,255,255,0.32)'}
                strokeWidth="1.8" fill="none"
              />
              <line x1="3" y1="10" x2="21" y2="10"
                stroke={is('/today') ? '#F4A582' : 'rgba(255,255,255,0.32)'}
                strokeWidth="1.8"
              />
              <line x1="8"  y1="3" x2="8"  y2="7" stroke={is('/today') ? '#F4A582' : 'rgba(255,255,255,0.32)'} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="16" y1="3" x2="16" y2="7" stroke={is('/today') ? '#F4A582' : 'rgba(255,255,255,0.32)'} strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="15.5" r="2" fill={is('/today') ? '#F4A582' : 'rgba(255,255,255,0.32)'} />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/today') ? '#F4A582' : 'rgba(255,255,255,0.28)' }}>
            Today
          </span>
        </Link>

        {/* Focus */}
        <Link href="/focus" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/focus') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={is('/focus') ? '#F4A582' : 'rgba(255,255,255,0.32)'} strokeWidth="2" />
              <path d="M12 7V12L15 15" stroke={is('/focus') ? '#F4A582' : 'rgba(255,255,255,0.32)'} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/focus') ? '#F4A582' : 'rgba(255,255,255,0.28)' }}>
            Focus
          </span>
        </Link>

        {/* Lumi — floats above nav, Acorns-style */}
        <Link href="/chat" className="flex flex-col items-center gap-1 flex-1 -mt-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
              boxShadow: '0 4px 20px rgba(244,165,130,0.5)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3.5" fill="#1E1C2E"/>
              <line x1="12" y1="2"    x2="12" y2="5.5"   stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="12" y1="18.5" x2="12" y2="22"    stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="2"  y1="12"   x2="5.5"  y2="12"  stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="18.5" y1="12" x2="22"   y2="12"  stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="4.93" y1="4.93"   x2="7.05" y2="7.05"   stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="4.93" y1="19.07"  x2="7.05" y2="16.95"  stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="16.95" y1="7.05"  x2="19.07" y2="4.93"  stroke="#1E1C2E" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: '#F4A582' }}>
            Lumi
          </span>
        </Link>

        {/* Capture */}
        <Link href="/capture" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/capture') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15C21 15.55 20.55 16 20 16H7L3 20V4C3 3.45 3.45 3 4 3H20C20.55 3 21 3.45 21 4V15Z"
                stroke={is('/capture') ? '#F4A582' : 'rgba(255,255,255,0.32)'}
                strokeWidth="2" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/capture') ? '#F4A582' : 'rgba(255,255,255,0.28)' }}>
            Capture
          </span>
        </Link>

        {/* Insights */}
        <Link href="/insights" className="flex flex-col items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-11 h-8 rounded-2xl transition-colors ${is('/insights') ? 'bg-[rgba(244,165,130,0.15)]' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4"  y="14" width="3" height="7" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(255,255,255,0.32)'} />
              <rect x="10" y="9"  width="3" height="12" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(255,255,255,0.32)'} />
              <rect x="16" y="4"  width="3" height="17" rx="1" fill={is('/insights') ? '#F4A582' : 'rgba(255,255,255,0.32)'} />
            </svg>
          </div>
          <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-nunito-sans)', color: is('/insights') ? '#F4A582' : 'rgba(255,255,255,0.28)' }}>
            Insights
          </span>
        </Link>

      </div>
    </nav>
  )
}
