'use client'

import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      style={{
        animation: 'pageIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </div>
  )
}
