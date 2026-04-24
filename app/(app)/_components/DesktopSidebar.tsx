'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'


function NavItem({
  href, label, active, icon,
}: {
  href: string
  label: string
  active: boolean
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 12,
        background: active ? 'rgba(244,165,130,0.12)' : 'transparent',
        transition: 'background 0.15s',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ color: active ? '#F4A582' : 'rgba(45,42,62,0.38)', transition: 'color 0.15s', display: 'flex' }}>
        {icon}
      </span>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: active ? 700 : 500,
        color: active ? '#2D2A3E' : 'rgba(45,42,62,0.55)',
        transition: 'color 0.15s, font-weight 0.15s',
      }}>
        {label}
      </span>
    </Link>
  )
}

// ── Icons (same SVG paths as NavBar) ──────────────────────────
const TodayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M208,28H188V24a12,12,0,0,0-24,0v4H92V24a12,12,0,0,0-24,0v4H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28ZM68,52a12,12,0,0,0,24,0h72a12,12,0,0,0,24,0h16V76H52V52ZM52,204V100H204V204Zm92-76a16,16,0,1,1-16-16A16,16,0,0,1,144,128Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,128ZM96,176a16,16,0,1,1-16-16A16,16,0,0,1,96,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,144,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,176Z"/>
  </svg>
)
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 400 295" fill="currentColor">
    <path d="M85.6,53.1 L115,119.3 L85.6,53.1Z" opacity="0"/>
    {/* Use a chat bubble icon instead */}
    <circle cx="195.2" cy="196.4" r="89.3"/>
  </svg>
)
const FocusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z"/>
  </svg>
)
const CaptureIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"/>
  </svg>
)
const InsightsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z"/>
  </svg>
)
const MeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z"/>
  </svg>
)

// Simple message bubble icon for Chat nav
const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
  </svg>
)

export default function DesktopSidebar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside
      className="lumi-desktop-sidebar flex-col flex-shrink-0"
      style={{
        width: 220,
        height: '100%',
        background: '#FFFFFF',
        borderRight: '1px solid rgba(45,42,62,0.07)',
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: '28px 20px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumi-logo.svg" alt="Lumi" style={{ width: 160, height: 'auto' }} />
        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(45,42,62,0.42)',
          letterSpacing: '0.01em',
        }}>
          A new day for your brain.
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem href="/today"    label="Today"      active={is('/today')}    icon={<TodayIcon />} />
        <NavItem href="/chat"     label="Chat"       active={is('/chat')}     icon={<MessageIcon />} />
        <NavItem href="/focus"    label="Focus"      active={is('/focus')}    icon={<FocusIcon />} />
        <NavItem href="/capture"  label="Brain Dump" active={is('/capture')}  icon={<CaptureIcon />} />
        <NavItem href="/insights" label="Insights"   active={is('/insights')} icon={<InsightsIcon />} />
      </nav>

      {/* ── Profile ── */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(45,42,62,0.07)' }}>
        <NavItem href="/me" label="Profile" active={is('/me')} icon={<MeIcon />} />
      </div>
    </aside>
  )
}
