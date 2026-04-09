'use client'

export default function LumiTabIcon() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
        boxShadow: '0 4px 20px rgba(244,165,130,0.5)',
      }}
    >
      {/* Lumi brandmark — sun + 5 rays, white on gradient circle */}
      <svg
        width="30"
        height="30"
        viewBox="0 0 400 295"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 5 rays */}
        <rect x="85.6" y="53.1" width="29.4" height="66.2" rx="14.7" ry="14.7"
          transform="translate(-31.9 84.6) rotate(-40)" fill="white" opacity="0.9"/>
        <rect x="180.5" y="4.4" width="29.4" height="80.9" rx="14.7" ry="14.7"
          fill="white" opacity="0.9"/>
        <rect x="31.2" y="126.2" width="31.4" height="58.8" rx="15.7" ry="15.7"
          transform="translate(-115.6 157.8) rotate(-74)" fill="white" opacity="0.85"/>
        <rect x="325.1" y="126.2" width="31.4" height="58.8" rx="15.7" ry="15.7"
          transform="translate(396.4 -214.9) rotate(74)" fill="white" opacity="0.85"/>
        <rect x="272.7" y="53.2" width="29.4" height="66.2" rx="14.7" ry="14.7"
          transform="translate(122.7 -164.6) rotate(40)" fill="white" opacity="0.9"/>
        {/* Sun circle */}
        <circle cx="195.2" cy="196.4" r="89.3" fill="white"/>
      </svg>
    </div>
  )
}
