'use client'

import Link from 'next/link'

// Simple inline profile icon — drop this into any page header
export default function ProfileButton({ color = '#7a7890' }: { color?: string }) {
  return (
    <Link
      href="/me"
      aria-label="Profile"
      style={{ display: 'block', borderRadius: '50%', flexShrink: 0 }}
      className="active:scale-90 transition-transform"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="36" height="36" style={{ color }}>
        <g transform="scale(10.66667,10.66667)">
          <path fill="currentColor" d="M12,2c-5.523,0 -10,4.477 -10,10c0,5.523 4.477,10 10,10c5.523,0 10,-4.477 10,-10c0,-5.523 -4.477,-10 -10,-10zM12,4.75c1.795,0 3.25,1.455 3.25,3.25c0,1.795 -1.455,3.25 -3.25,3.25c-1.795,0 -3.25,-1.455 -3.25,-3.25c0,-1.795 1.455,-3.25 3.25,-3.25zM12,20c-2.438,0 -4.621,-1.091 -6.088,-2.812c-0.381,-0.447 -0.296,-1.118 0.173,-1.471c1.517,-1.141 4.281,-1.717 5.915,-1.717c1.634,0 4.398,0.576 5.916,1.717c0.469,0.353 0.554,1.025 0.173,1.471c-1.468,1.721 -3.651,2.812 -6.089,2.812z"/>
        </g>
      </svg>
    </Link>
  )
}
