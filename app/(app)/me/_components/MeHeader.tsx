import Link from 'next/link'

interface MeHeaderProps {
  title: string
  subtitle?: string
  back?: string // href to go back to, defaults to /me
}

export default function MeHeader({ title, subtitle, back = '/me' }: MeHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 4,
      padding: '12px 20px 20px',
    }}>
      {/* Back button — same vertical position as Today's greeting */}
      <Link
        href={back}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(45,42,62,0.05)',
          flexShrink: 0,
          marginTop: 3,
          marginRight: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M13 4L7 10L13 16" stroke="#2D2A3E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      <div>
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '26px',
          fontWeight: 900,
          color: '#1E1C2E',
          lineHeight: 1.1,
          margin: 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#9895B0',
            marginTop: 3,
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
