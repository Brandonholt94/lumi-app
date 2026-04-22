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

      {/* Lumi wordmark — Aegora, letters stagger in */}
      <svg
        style={{ position: 'relative', zIndex: 2, width: '140px' }}
        viewBox="0 0 216.1 85"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* l */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2s forwards' }}
          d="M25.2,6.5v68.7c0,.9.1,1.6.3,2s.6.7,1.1.9l1.9.5c.5.2.9.4,1.1.6s.3.6.3,1-.2.9-.5,1.2c-.3.3-.9.4-1.6.4H5.3c-.7,0-1.2-.1-1.5-.4-.3-.3-.5-.7-.5-1.2s.1-.7.3-.9c.2-.3.6-.5,1.1-.7l1.9-.5c.5-.2.9-.5,1.1-.9.2-.4.3-1.1.3-2V14.7c0-.7-.1-1.1-.3-1.4-.2-.3-.5-.4-1-.5l-2.3-.2c-.4-.1-.8-.3-1-.5-.2-.2-.3-.6-.3-.9s.1-.8.4-1c.3-.2.7-.5,1.4-.7l13.6-4.4c1-.4,1.8-.6,2.4-.8.6-.2,1.1-.2,1.5-.2.9,0,1.5.2,1.9.7.4.5.6,1.1.6,1.8Z"
        />
        {/* u */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.3s forwards' }}
          d="M36.4,68.4v-25c0-.7-.1-1.1-.3-1.4s-.5-.5-1-.5l-2.3-.2c-.5-.1-.8-.3-1-.5s-.3-.5-.3-.9.1-.8.4-1.1.7-.5,1.4-.8l13.6-4.4c1-.4,1.8-.6,2.4-.8.6-.1,1.1-.2,1.6-.2.8,0,1.5.2,1.9.7.4.5.6,1,.6,1.8v31.1c0,2.6.6,4.5,1.8,5.8,1.2,1.3,2.8,1.9,4.8,1.9s2.7-.3,4-.9c1.4-.6,2.7-1.4,4-2.6l1.9-1.7,1.8,1.9-1.9,1.7c-4.2,3.8-8,6.6-11.2,8.2-3.3,1.6-6.3,2.4-9,2.4-3.9,0-7.2-1.3-9.6-3.8-2.5-2.5-3.7-6.1-3.7-10.8ZM68.3,76.3v-4.2l-.3-.2v-28.4c0-.7-.1-1.1-.3-1.4s-.5-.5-1-.5l-2.3-.2c-.5-.1-.8-.3-1-.5-.2-.2-.3-.5-.3-.9s.1-.8.4-1.1.7-.5,1.3-.8l13.7-4.4c1-.3,1.7-.6,2.3-.8.6-.2,1.2-.2,1.7-.2.8,0,1.4.2,1.8.7.4.5.6,1,.6,1.8v40c0,.9.1,1.6.3,2s.6.7,1.1.9l2,.5c.5.2.8.4,1.1.6.2.3.3.6.3,1s-.2.9-.5,1.2c-.3.3-.9.4-1.6.4h-14.5c-1.4,0-2.6-.5-3.5-1.6-1-1.1-1.4-2.4-1.4-3.9Z"
        />
        {/* m */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.6s forwards' }}
          d="M114.6,35.1v40.1c0,.9.1,1.6.3,2s.6.7,1.1.9l1.9.5c.8.3,1.1.9,1.1,1.6,0,1.1-.7,1.7-2.1,1.7h-22.3c-.7,0-1.2-.1-1.5-.4-.3-.3-.5-.7-.5-1.2s.1-.7.3-.9c.2-.3.6-.5,1-.7l2-.5c.5-.2.9-.5,1.1-.9s.3-1.1.3-2v-31.9c0-.6-.1-1.1-.3-1.4-.2-.3-.5-.5-1-.5l-2.3-.2c-.4-.1-.8-.3-1-.5-.2-.2-.3-.6-.3-.9s.1-.8.4-1c.2-.2.7-.5,1.3-.7l13.6-4.4c1-.4,1.8-.6,2.4-.8.6-.2,1.1-.2,1.7-.2.8,0,1.5.2,1.9.7s.6,1.1.6,1.8ZM113,46.7l-1.8-1.8,1.9-1.7c4.2-3.9,7.9-6.6,11.1-8.2,3.2-1.6,6.2-2.4,9-2.4,4,0,7.2,1.3,9.6,3.8,2.4,2.5,3.6,6.1,3.6,10.8v27.9c0,.9.1,1.6.4,2,.3.4.7.8,1.2,1l1.8.5c.8.3,1.1.9,1.1,1.6,0,1.1-.7,1.7-2,1.7h-22.1c-1.4,0-2.1-.6-2.1-1.7s.4-1.2,1.2-1.6l1.9-.5c.6-.2.9-.5,1.2-.9s.3-1.1.3-2v-25.7c0-2.6-.6-4.6-1.7-5.8-1.1-1.3-2.8-1.9-4.8-1.9s-2.6.3-4,.9c-1.3.6-2.7,1.4-4,2.6l-1.9,1.7ZM144.7,46.7l-1.8-1.8,1.9-1.7c4.2-3.9,7.9-6.6,11.2-8.2,3.2-1.6,6.2-2.4,9-2.4,4,0,7.2,1.3,9.6,3.8,2.4,2.5,3.6,6.1,3.6,10.8v27.9c0,.9.1,1.6.4,2.1.2.4.6.8,1.2.9l1.9.5c.5.2.8.4,1,.7.2.3.3.6.3.9,0,.5-.2.9-.5,1.2-.3.3-.8.4-1.5.4h-22.3c-1.4,0-2.1-.6-2.1-1.7s.4-1.2,1.1-1.6l2-.5c.6-.2.9-.5,1.2-.9s.3-1.1.3-2v-25.7c0-2.6-.6-4.6-1.7-5.8-1.1-1.3-2.8-1.9-4.8-1.9s-2.6.3-4,.9c-1.3.6-2.7,1.4-4,2.6l-1.9,1.7Z"
        />
        {/* i */}
        <path
          fill="#2e2a3e"
          style={{ opacity: 0, animation: 'lumiLetterIn 0.5s ease 2.9s forwards' }}
          d="M207.2,35.1v40.1c0,.9.1,1.6.3,2s.6.7,1.1.9l1.9.5c.5.2.9.4,1.1.6s.3.6.3,1-.2.9-.5,1.2c-.3.3-.8.4-1.5.4h-22.6c-.7,0-1.2-.1-1.5-.4s-.5-.7-.5-1.2.1-.7.3-.9c.2-.3.6-.5,1-.7l2-.5c.6-.2.9-.5,1.1-.9s.3-1.1.3-2v-31.9c0-.6-.1-1.1-.3-1.4-.2-.3-.5-.5-1-.5l-2.3-.2c-.5-.1-.8-.3-1-.5-.2-.2-.3-.6-.3-.9s.1-.8.4-1c.3-.2.7-.5,1.4-.7l13.6-4.4c1-.4,1.8-.6,2.4-.8.6-.2,1.1-.2,1.6-.2.8,0,1.5.2,1.9.7.4.5.6,1.1.6,1.8ZM197.9,27.1c-3,0-5.5-.8-7.3-2.5s-2.7-3.8-2.7-6.4.9-4.7,2.8-6.4,4.3-2.5,7.3-2.5,5.5.8,7.3,2.5,2.8,3.8,2.8,6.4-.9,4.8-2.8,6.4-4.3,2.5-7.3,2.5Z"
        />
      </svg>
    </div>
  )
}
