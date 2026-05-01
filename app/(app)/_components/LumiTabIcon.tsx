'use client'

export default function LumiTabIcon({ active = false }: { active?: boolean }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: active
          ? '0 0 0 3px rgba(244,165,130,0.30), 0 6px 20px rgba(244,165,130,0.40)'
          : '0 4px 16px rgba(45,42,62,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 0.25s ease',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lumi-character.png" alt="Lumi" style={{ width: 40, height: 40, objectFit: 'contain' }} />
    </div>
  )
}
