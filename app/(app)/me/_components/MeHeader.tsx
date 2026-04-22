import Link from 'next/link'

interface MeHeaderProps {
  title: string
  subtitle?: string
  back?: string
}

export default function MeHeader({ title, subtitle, back = '/me' }: MeHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px 14px',
      borderBottom: '1px solid rgba(45,42,62,0.06)',
    }}>
      {/* Back link */}
      <Link
        href={back}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: subtitle ? 10 : 8,
          textDecoration: 'none',
          width: 'fit-content',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M13 4L7 10L13 16" stroke="#9895B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 700,
          color: '#9895B0',
        }}>
          Back
        </span>
      </Link>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '20px',
        fontWeight: 800,
        color: '#1E1C2E',
        lineHeight: 1.15,
        margin: 0,
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 500,
          color: '#9895B0',
          marginTop: 4,
          lineHeight: 1.4,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
