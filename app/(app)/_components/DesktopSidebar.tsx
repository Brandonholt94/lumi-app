'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const EXPANDED_W  = 220
const COLLAPSED_W = 64

// ── Icons ──────────────────────────────────────────────────────
const TodayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M208,28H188V24a12,12,0,0,0-24,0v4H92V24a12,12,0,0,0-24,0v4H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28ZM68,52a12,12,0,0,0,24,0h72a12,12,0,0,0,24,0h16V76H52V52ZM52,204V100H204V204Zm92-76a16,16,0,1,1-16-16A16,16,0,0,1,144,128Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,128ZM96,176a16,16,0,1,1-16-16A16,16,0,0,1,96,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,144,176Zm48,0a16,16,0,1,1-16-16A16,16,0,0,1,192,176Z"/>
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

const LumiNavIcon = ({ active }: { active: boolean }) => (
  <div style={{
    width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: active ? '0 0 0 3px #F4A582, 0 4px 16px rgba(244,165,130,0.45)' : '0 2px 10px rgba(45,42,62,0.12)',
    transition: 'box-shadow 0.25s ease',
  }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/lumi-character.png" alt="Lumi" style={{ width: 28, height: 28, objectFit: 'contain' }} />
  </div>
)

// Chevron used for the collapse toggle
const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    style={{ transition: 'transform 0.25s', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── NavItem ────────────────────────────────────────────────────
function NavItem({
  href, label, active, icon, collapsed,
}: {
  href: string; label: string; active: boolean; icon: React.ReactNode; collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        padding: collapsed ? '10px 0' : '10px 12px',
        borderRadius: 12,
        background: active ? 'rgba(244,165,130,0.12)' : 'transparent',
        transition: 'background 0.15s, padding 0.25s',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      <span style={{
        color: active ? '#F4A582' : 'rgba(45,42,62,0.38)',
        transition: 'color 0.15s',
        display: 'flex', flexShrink: 0,
      }}>
        {icon}
      </span>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: active ? 700 : 500,
        color: active ? '#2D2A3E' : 'rgba(45,42,62,0.55)',
        transition: 'opacity 0.15s, max-width 0.25s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        maxWidth: collapsed ? 0 : 160,
        opacity: collapsed ? 0 : 1,
      }}>
        {label}
      </span>
    </Link>
  )
}

// ── Sidebar ────────────────────────────────────────────────────
export default function DesktopSidebar() {
  const pathname = usePathname()
  const is = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load persisted preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('lumi-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggle() {
    setCollapsed(c => {
      localStorage.setItem('lumi-sidebar-collapsed', String(!c))
      return !c
    })
  }

  const w = mounted ? (collapsed ? COLLAPSED_W : EXPANDED_W) : EXPANDED_W

  return (
    <aside
      className="lumi-desktop-sidebar flex-col flex-shrink-0"
      style={{
        width: w,
        height: '100%',
        background: '#FFFFFF',
        borderRight: '1px solid rgba(45,42,62,0.07)',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Logo / brand ── */}
      <div style={{
        padding: collapsed ? '24px 0 18px' : '28px 12px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'flex-start',
        gap: 6,
        transition: 'padding 0.25s',
        flexShrink: 0,
      }}>
        {collapsed ? (
          /* Collapsed: just the Lumi icon */
          <Link href="/chat" title="Lumi" style={{ display: 'flex' }}>
            <LumiNavIcon active={is('/chat')} />
          </Link>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lumi-logo-new.png" alt="Lumi" style={{ width: 180, height: 'auto' }} />
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        padding: collapsed ? '4px 8px' : '4px 12px',
        display: 'flex', flexDirection: 'column', gap: 2,
        transition: 'padding 0.25s',
      }}>
        <NavItem href="/today"    label="Today"      active={is('/today')}    icon={<TodayIcon />}    collapsed={collapsed} />
        <NavItem href="/focus"    label="Focus"      active={is('/focus')}    icon={<FocusIcon />}    collapsed={collapsed} />
        <NavItem href="/capture"  label="Brain Dump" active={is('/capture')}  icon={<CaptureIcon />}  collapsed={collapsed} />
        <NavItem href="/insights" label="Insights"   active={is('/insights')} icon={<InsightsIcon />} collapsed={collapsed} />

        {/* ── Lumi chat ── */}
        {!collapsed ? (
          <Link
            href="/chat"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 12px', borderRadius: 14,
              background: is('/chat')
                ? 'linear-gradient(135deg, rgba(244,165,130,0.18), rgba(245,201,138,0.14))'
                : 'linear-gradient(135deg, rgba(244,165,130,0.10), rgba(245,201,138,0.08))',
              border: `1.5px solid ${is('/chat') ? 'rgba(244,165,130,0.40)' : 'rgba(244,165,130,0.22)'}`,
              textDecoration: 'none', marginBottom: 8,
              transition: 'background 0.15s, border-color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <LumiNavIcon active={is('/chat')} />
            <span style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 700,
              color: is('/chat') ? '#2D2A3E' : 'rgba(45,42,62,0.70)',
              whiteSpace: 'nowrap',
            }}>Lumi</span>
          </Link>
        ) : (
          /* Collapsed Lumi — centered icon, pill border */
          <Link
            href="/chat"
            title="Lumi"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px 0', borderRadius: 14, marginBottom: 8,
              background: is('/chat')
                ? 'linear-gradient(135deg, rgba(244,165,130,0.18), rgba(245,201,138,0.14))'
                : 'linear-gradient(135deg, rgba(244,165,130,0.10), rgba(245,201,138,0.08))',
              border: `1.5px solid ${is('/chat') ? 'rgba(244,165,130,0.40)' : 'rgba(244,165,130,0.22)'}`,
              textDecoration: 'none',
              transition: 'background 0.15s, border-color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <LumiNavIcon active={is('/chat')} />
          </Link>
        )}
      </nav>

      {/* ── Profile ── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px',
        borderTop: '1px solid rgba(45,42,62,0.07)',
        transition: 'padding 0.25s',
        flexShrink: 0,
      }}>
        <NavItem href="/me" label="Profile" active={is('/me')} icon={<MeIcon />} collapsed={collapsed} />
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          gap: 6, padding: '10px 16px',
          background: 'transparent', border: 'none',
          borderTop: '1px solid rgba(45,42,62,0.05)',
          cursor: 'pointer', color: 'rgba(45,42,62,0.28)',
          transition: 'color 0.15s, padding 0.25s',
          flexShrink: 0,
          width: '100%',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(45,42,62,0.55)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(45,42,62,0.28)')}
      >
        {!collapsed && (
          <span style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 600,
            whiteSpace: 'nowrap', letterSpacing: '0.01em',
          }}>
            Collapse
          </span>
        )}
        <ChevronIcon collapsed={collapsed} />
      </button>
    </aside>
  )
}
