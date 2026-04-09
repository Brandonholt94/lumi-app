import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'

// ─── Icon primitives ────────────────────────────────────────────────────────

function IconWrap({ children, color = '#7A7890' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      width: 36,
      height: 36,
      minWidth: 36,
      minHeight: 36,
      borderRadius: '50%',
      background: 'rgba(45,42,62,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
    }}>
      {children}
    </div>
  )
}

const icons = {
  person: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  sparkle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  pill: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z"/><line x1="8.5" y1="11.5" x2="15.5" y2="4.5"/>
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  trophy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  sos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

// ─── Row ────────────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  value,
  valueDim,
  href,
  danger,
  last,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  valueDim?: boolean
  href: string
  danger?: boolean
  last?: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        borderBottom: last ? 'none' : '1px solid rgba(45,42,62,0.06)',
        gap: 14,
        background: 'white',
      }}>
        <IconWrap color={danger ? '#E05252' : '#7A7890'}>
          {icon}
        </IconWrap>

        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '15px',
          fontWeight: 600,
          color: danger ? '#E05252' : '#1E1C2E',
          flex: 1,
        }}>
          {label}
        </span>

        {value && (
          <span style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 700,
            color: valueDim ? '#9895B0' : '#2D2A3E',
            background: valueDim ? 'transparent' : 'rgba(45,42,62,0.05)',
            borderRadius: 6,
            padding: valueDim ? 0 : '3px 8px',
          }}>
            {value}
          </span>
        )}

        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="#C4C0D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '13px',
        fontWeight: 700,
        color: '#1E1C2E',
        marginBottom: 8,
        paddingLeft: 4,
      }}>
        {title}
      </p>
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid rgba(45,42,62,0.07)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function MePage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? ''
  const lastName = user?.lastName ?? ''
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''
  // Only use imageUrl if user explicitly uploaded a photo (hasImage),
  // otherwise Clerk returns a generated purple/blue avatar
  const avatar = user?.hasImage ? user.imageUrl : null

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#ffffff', paddingBottom: 40 }}>

      {/* Avatar + name hero */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid rgba(45,42,62,0.07)',
        padding: '28px 20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt="Avatar"
            style={{
              width: 64,
              height: 64,
              minWidth: 64,
              minHeight: 64,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Gray silhouette — same style as the nav button */
          <div style={{
            width: 64,
            height: 64,
            minWidth: 64,
            minHeight: 64,
            borderRadius: '50%',
            background: '#AEAEB2',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <svg width="48" height="48" viewBox="0 0 28 28" fill="none" style={{ marginBottom: -3 }}>
              <circle cx="14" cy="10" r="5" fill="white" />
              <path d="M4 26c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="white" />
            </svg>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '20px',
            fontWeight: 700,
            color: '#1E1C2E',
            lineHeight: 1.2,
            marginBottom: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {[firstName, lastName].filter(Boolean).join(' ') || 'Your name'}
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#9895B0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {email}
          </p>
        </div>

        <Link href="/me/edit-profile" style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(45,42,62,0.06)',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '13px',
          fontWeight: 700,
          color: '#7A7890',
          textDecoration: 'none',
        }}>
          Edit
        </Link>
      </div>

      <div className="px-4">

        {/* YOU */}
        <Section title="You">
          <Row icon={icons.sparkle}  label="How Lumi addresses you"    href="/me/lumi-preferences" />
          <Row icon={icons.clipboard} label="Onboarding answers"        href="/me/onboarding" last />
        </Section>

        {/* HEALTH */}
        <Section title="Health">
          <Row icon={icons.pill} label="Medication log" href="/me/medication" />
          <Row icon={icons.moon} label="Sleep log"      href="/me/sleep"      last />
        </Section>

        {/* ACCOUNT */}
        <Section title="Account">
          <Row icon={icons.star}    label="Your plan"     value="Free"  valueDim  href="/me/subscription" />
          <Row icon={icons.bell}    label="Notifications"               href="/me/notifications" />
          <Row icon={icons.trophy}  label="Your wins"                   href="/me/wins"          last />
        </Section>

        {/* SUPPORT */}
        <Section title="Support">
          <Row icon={icons.sos}     label="Crisis resources"  href="/me/crisis"   />
          <Row icon={icons.message} label="Contact us"        href="/me/contact"  />
          <Row icon={icons.info}    label="About Lumi"        href="/me/about"    />
          <Row icon={icons.logout}  label="Sign out"  danger  href="/sign-out"    last />
        </Section>

        {/* Version */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.25)',
          marginTop: 4,
        }}>
          Lumi · v0.1 · Built with care by Craft + Code LLC
        </p>

      </div>
    </div>
  )
}
