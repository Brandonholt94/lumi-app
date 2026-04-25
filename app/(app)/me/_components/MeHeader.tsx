import Link from 'next/link'

interface MeHeaderProps {
  title: string
  subtitle?: string
  back?: string
  /** Extra breadcrumb segments beyond "Profile". e.g. [{ label: 'Health', href: '/me' }] */
  crumbs?: { label: string; href: string }[]
}

export default function MeHeader({ title, subtitle, back = '/me', crumbs }: MeHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px 14px',
      borderBottom: '1px solid rgba(45,42,62,0.06)',
    }}>
      {/* ── Breadcrumb trail ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        <Link href="/me" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px', fontWeight: 700,
            color: '#9895B0',
            transition: 'color 0.15s',
          }}>
            Profile
          </span>
        </Link>

        {crumbs?.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 256 256" fill="#C4C1D4">
              <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>
            </svg>
            <Link href={crumb.href} style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '12px', fontWeight: 700,
                color: '#9895B0',
              }}>
                {crumb.label}
              </span>
            </Link>
          </span>
        ))}

        {/* Current page — not a link */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 256 256" fill="#C4C1D4">
            <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>
          </svg>
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px', fontWeight: 700,
            color: '#2D2A3E',
          }}>
            {title}
          </span>
        </span>
      </nav>

      {/* ── Page title ── */}
      <h1 style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '20px', fontWeight: 800,
        color: '#1E1C2E', lineHeight: 1.15, margin: 0,
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px', fontWeight: 500,
          color: '#9895B0', marginTop: 4, lineHeight: 1.4,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
