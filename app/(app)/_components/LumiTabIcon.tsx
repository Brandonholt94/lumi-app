'use client'

export default function LumiTabIcon({ active = false }: { active?: boolean }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0.75,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lumi-glow-icon.png" alt="Lumi" style={{ width: 68, height: 68, objectFit: 'contain' }} />
    </div>
  )
}
