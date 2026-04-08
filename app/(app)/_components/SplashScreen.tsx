'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('lumi_splash_date')
    if (lastShown !== today) {
      setVisible(true)
      localStorage.setItem('lumi_splash_date', today)
      // Remove from DOM after animation completes
      const timer = setTimeout(() => setVisible(false), 6500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FBF8F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        animation: 'lumiSplashFadeOut 0.9s ease 5.5s forwards',
      }}
    >
      <style>{`
        @keyframes lumiSplashFadeOut {
          to { opacity: 0; pointer-events: none; }
        }
        @keyframes lumiOrbExpand {
          0%   { transform: scale(0);   opacity: 1; }
          100% { transform: scale(9.5); opacity: 0.85; }
        }
        @keyframes lumiLetterIn {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Expanding gradient orb */}
      <div
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,165,130,0.9) 0%, rgba(245,201,138,0.7) 30%, rgba(232,160,191,0.3) 65%, transparent 100%)',
          transform: 'scale(0)',
          animation: 'lumiOrbExpand 4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards',
        }}
      />

      {/* Official Lumi wordmark — letters stagger in */}
      <svg
        style={{ position: 'relative', zIndex: 2, width: '130px' }}
        viewBox="0 0 184.3 79.3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* L */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2s forwards' }}
          d="M20.1,75.2c-6.1,0-10.6-1.6-13.4-4.8-2.9-3.2-4.3-7.9-4.3-14.3V5.6h14.7v49.9c0,1.7.3,3.1.8,4.3.5,1.2,1.3,2,2.3,2.6,1,.6,2.3.8,3.8.8s1.4,0,2.1,0c.7,0,1.3-.1,1.9-.3v11.4c-1.4.3-2.7.6-3.9.7-1.2.2-2.6.2-4,.2Z"
        />
        {/* U */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.3s forwards' }}
          d="M49.5,75.2c-4,0-7.4-.7-10-2.2-2.7-1.5-4.6-3.7-5.9-6.7-1.3-3-1.9-6.7-1.9-11.1v-28.6h14.7v28.9c0,1.8.3,3.4.8,4.7s1.3,2.3,2.4,2.9c1.1.6,2.4.9,4.1.9s3.5-.4,5-1.3c1.4-.9,2.5-2.1,3.4-3.7.8-1.6,1.2-3.5,1.2-5.7v-26.6h14.7v47.7h-14.4v-9.3h1.6c-1.4,3.4-3.5,5.9-6.1,7.7-2.7,1.8-5.8,2.6-9.4,2.6Z"
        />
        {/* M */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.6s forwards' }}
          d="M84.5,74.2V26.5h14.4v9h-1.1c.9-2.1,2.1-3.9,3.6-5.4,1.5-1.5,3.2-2.6,5.3-3.5,2.1-.8,4.3-1.2,6.8-1.2,3.7,0,6.8.9,9.2,2.6,2.5,1.8,4.2,4.4,5.3,8h-1.4c1.4-3.2,3.6-5.8,6.6-7.7,3-1.9,6.4-2.9,10.1-2.9s6.7.7,9.1,2.1c2.4,1.4,4.2,3.7,5.4,6.7s1.8,6.8,1.8,11.3v28.6h-14.7v-28.1c0-3.2-.5-5.6-1.5-7.1-1-1.5-2.7-2.2-5.3-2.2s-3.3.4-4.6,1.3c-1.3.8-2.4,2.1-3.1,3.8-.7,1.7-1.1,3.7-1.1,6.1v26.2h-14.7v-28.1c0-3.2-.5-5.6-1.6-7.1-1-1.5-2.7-2.2-5.1-2.2s-3.4.4-4.7,1.3c-1.3.8-2.4,2.1-3.1,3.8-.7,1.7-1.1,6.1-1.1,6.1v26.2h-14.7Z"
        />
        {/* I */}
        <g style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.9s forwards' }}>
          <polyline fill="#2e2a3e" points="181.2 17.2 165.2 17.2 165.2 3.5 181.2 3.5"/>
          <rect fill="#2e2a3e" x="165.8" y="26.5" width="14.7" height="47.7"/>
        </g>
      </svg>
    </div>
  )
}
