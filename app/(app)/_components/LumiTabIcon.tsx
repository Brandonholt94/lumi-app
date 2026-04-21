'use client'

export default function LumiTabIcon({ active = false }: { active?: boolean }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
        boxShadow: active
          ? '0 0 0 3px rgba(244,165,130,0.35), 0 6px 24px rgba(244,165,130,0.55)'
          : '0 4px 20px rgba(244,165,130,0.45)',
        transition: 'box-shadow 0.25s ease',
      }}
    >
      {/* Lumi brandmark — exact shape, all white, with horizon line */}
      <svg
        width="33"
        height="30"
        viewBox="0 0 166.9 151.3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sun circle */}
        <circle cx="83.8" cy="91" r="37.5" fill="white" />
        {/* Ray 1 — upper left diagonal */}
        <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9"
          transform="translate(-18.5 38.7) rotate(-40)" fill="white" />
        {/* Ray 2 — top center */}
        <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9"
          fill="white" />
        {/* Ray 3 — far left */}
        <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2"
          transform="translate(-55.4 74.1) rotate(-74)" fill="white" />
        {/* Ray 4 — far right */}
        <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2"
          transform="translate(-14.7 42.8) rotate(-16)" fill="white" />
        {/* Ray 5 — upper right diagonal */}
        <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9"
          transform="translate(9.5 109.8) rotate(-50)" fill="white" />
        {/* Horizon line */}
        <rect x="10" y="133.4" width="147.6" height="7.9" rx="3.1" ry="3.1"
          fill="white" opacity="0.72" />
      </svg>
    </div>
  )
}
