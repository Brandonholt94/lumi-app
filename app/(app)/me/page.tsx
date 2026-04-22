import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// ─── Icon set (Phosphor Bold) ────────────────────────────────────────────────

const icons = {
  sparkle: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M199,125.31l-49.88-18.39L130.69,57a19.92,19.92,0,0,0-37.38,0L74.92,106.92,25,125.31a19.92,19.92,0,0,0,0,37.38l49.88,18.39L93.31,231a19.92,19.92,0,0,0,37.38,0l18.39-49.88L199,162.69a19.92,19.92,0,0,0,0-37.38Zm-63.38,35.16a12,12,0,0,0-7.11,7.11L112,212.28l-16.47-44.7a12,12,0,0,0-7.11-7.11L43.72,144l44.7-16.47a12,12,0,0,0,7.11-7.11L112,75.72l16.47,44.7a12,12,0,0,0,7.11,7.11L180.28,144ZM140,40a12,12,0,0,1,12-12h12V16a12,12,0,0,1,24,0V28h12a12,12,0,0,1,0,24H188V64a12,12,0,0,1-24,0V52H152A12,12,0,0,1,140,40ZM252,88a12,12,0,0,1-12,12h-4v4a12,12,0,0,1-24,0v-4h-4a12,12,0,0,1,0-24h4V72a12,12,0,0,1,24,0v4h4A12,12,0,0,1,252,88Z"/>
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M172,164a12,12,0,0,1-12,12H96a12,12,0,0,1,0-24h64A12,12,0,0,1,172,164Zm-12-52H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24Zm60-64V216a20,20,0,0,1-20,20H56a20,20,0,0,1-20-20V48A20,20,0,0,1,56,28H90.53a51.88,51.88,0,0,1,74.94,0H200A20,20,0,0,1,220,48ZM100.29,60h55.42a28,28,0,0,0-55.42,0ZM196,52H178.59A52.13,52.13,0,0,1,180,64v8a12,12,0,0,1-12,12H88A12,12,0,0,1,76,72V64a52.13,52.13,0,0,1,1.41-12H60V212H196Z"/>
    </svg>
  ),
  pill: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M219.26,36.77a57.28,57.28,0,0,0-81,0L36.77,138.26a57.26,57.26,0,0,0,81,81L219.26,117.74A57.33,57.33,0,0,0,219.26,36.77ZM100.78,202.26a33.26,33.26,0,1,1-47-47L96,113l47,47Zm101.5-101.49L160,143,113,96l42.27-42.26a33.26,33.26,0,0,1,47,47Zm-9.77-25.26a12,12,0,0,1,0,17l-24,24a12,12,0,1,1-17-17l24-24A12,12,0,0,1,192.51,75.51Z"/>
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M244,96a12,12,0,0,1-12,12H220v12a12,12,0,0,1-24,0V108H184a12,12,0,0,1,0-24h12V72a12,12,0,0,1,24,0V84h12A12,12,0,0,1,244,96ZM144,60h4v4a12,12,0,0,0,24,0V60h4a12,12,0,0,0,0-24h-4V32a12,12,0,0,0-24,0v4h-4a12,12,0,0,0,0,24Zm75.81,90.38A12,12,0,0,1,222,162.3,100,100,0,1,1,93.7,34a12,12,0,0,1,15.89,13.6A85.12,85.12,0,0,0,108,64a84.09,84.09,0,0,0,84,84,85.22,85.22,0,0,0,16.37-1.59A12,12,0,0,1,219.81,150.38ZM190,172A108.13,108.13,0,0,1,84,66,76,76,0,1,0,190,172Z"/>
    </svg>
  ),
  crown: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M232,60H212V48a12,12,0,0,0-12-12H56A12,12,0,0,0,44,48V60H24A20,20,0,0,0,4,80V96a44.05,44.05,0,0,0,44,44h.77A84.18,84.18,0,0,0,116,195.15V212H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24H140V195.11c30.94-4.51,56.53-26.2,67-55.11h1a44.05,44.05,0,0,0,44-44V80A20,20,0,0,0,232,60ZM28,96V84H44v28c0,1.21,0,2.41.09,3.61A20,20,0,0,1,28,96Zm160,15.1c0,33.33-26.71,60.65-59.54,60.9A60,60,0,0,1,68,112V60H188ZM228,96a20,20,0,0,1-16.12,19.62c.08-1.5.12-3,.12-4.52V84h16Z"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M225.81,74.65A11.86,11.86,0,0,1,220.3,76a12,12,0,0,1-10.67-6.47,90.1,90.1,0,0,0-32-35.38,12,12,0,1,1,12.8-20.29,115.25,115.25,0,0,1,40.54,44.62A12,12,0,0,1,225.81,74.65ZM46.37,69.53a90.1,90.1,0,0,1,32-35.38A12,12,0,1,0,65.6,13.86,115.25,115.25,0,0,0,25.06,58.48a12,12,0,0,0,5.13,16.17A11.86,11.86,0,0,0,35.7,76,12,12,0,0,0,46.37,69.53Zm173.51,98.35A20,20,0,0,1,204,200H171.81a44,44,0,0,1-87.62,0H52a20,20,0,0,1-15.91-32.12c7.17-9.33,15.73-26.62,15.88-55.94A76,76,0,0,1,204,112C204.15,141.26,212.71,158.55,219.88,167.88ZM147.6,200H108.4a20,20,0,0,0,39.2,0Zm48.74-24c-8.16-13-16.19-33.57-16.34-63.94A52,52,0,1,0,76,112c-.15,30.42-8.18,51-16.34,64Z"/>
    </svg>
  ),
  trophy: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M232,60H212V48a12,12,0,0,0-12-12H56A12,12,0,0,0,44,48V60H24A20,20,0,0,0,4,80V96a44.05,44.05,0,0,0,44,44h.77A84.18,84.18,0,0,0,116,195.15V212H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24H140V195.11c30.94-4.51,56.53-26.2,67-55.11h1a44.05,44.05,0,0,0,44-44V80A20,20,0,0,0,232,60ZM28,96V84H44v28c0,1.21,0,2.41.09,3.61A20,20,0,0,1,28,96Zm160,15.1c0,33.33-26.71,60.65-59.54,60.9A60,60,0,0,1,68,112V60H188ZM228,96a20,20,0,0,1-16.12,19.62c.08-1.5.12-3,.12-4.52V84h16Z"/>
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M178,36c-20.09,0-37.92,7.93-50,21.56C115.92,43.93,98.09,36,78,36a66.08,66.08,0,0,0-66,66c0,72.34,105.81,130.14,110.31,132.57a12,12,0,0,0,11.38,0C138.19,232.14,244,174.34,244,102A66.08,66.08,0,0,0,178,36Zm-5.49,142.36A328.69,328.69,0,0,1,128,210.16a328.69,328.69,0,0,1-44.51-31.8C61.82,159.77,36,131.42,36,102A42,42,0,0,1,78,60c17.8,0,32.7,9.4,38.89,24.54a12,12,0,0,0,22.22,0C145.3,69.4,160.2,60,178,60a42,42,0,0,1,42,42C220,131.42,194.18,159.77,172.51,178.36Z"/>
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M88,128a16,16,0,1,1,16,16A16,16,0,0,1,88,128Zm64,16a16,16,0,1,0-16-16A16,16,0,0,0,152,144Zm84-80V192a20,20,0,0,1-20,20H84.47L53,239.17l-.12.11A19.91,19.91,0,0,1,40.05,244a20.14,20.14,0,0,1-8.49-1.9A19.82,19.82,0,0,1,20,224V64A20,20,0,0,1,40,44H216A20,20,0,0,1,236,64Zm-24,4H44V215.23l28.16-24.32A11.93,11.93,0,0,1,80,188H212Z"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M108,84a16,16,0,1,1,16,16A16,16,0,0,1,108,84Zm128,44A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Zm-72,36.68V132a20,20,0,0,0-20-20,12,12,0,0,0-4,23.32V168a20,20,0,0,0,20,20,12,12,0,0,0,4-23.32Z"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M124,216a12,12,0,0,1-12,12H48a12,12,0,0,1-12-12V40A12,12,0,0,1,48,28h64a12,12,0,0,1,0,24H60V204h52A12,12,0,0,1,124,216Zm108.49-96.49-40-40a12,12,0,0,0-17,17L195,116H112a12,12,0,0,0,0,24h83l-19.52,19.51a12,12,0,0,0,17,17l40-40A12,12,0,0,0,232.49,119.51Z"/>
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M243,96a20.33,20.33,0,0,0-17.74-14l-56.59-4.57L146.83,24.62a20.36,20.36,0,0,0-37.66,0L87.35,77.44,30.76,82A20.45,20.45,0,0,0,19.1,117.88l43.18,37.24-13.2,55.7A20.37,20.37,0,0,0,79.57,233L128,203.19,176.43,233a20.39,20.39,0,0,0,30.49-22.15l-13.2-55.7,43.18-37.24A20.43,20.43,0,0,0,243,96ZM172.53,141.7a12,12,0,0,0-3.84,11.86L181.58,208l-47.29-29.08a12,12,0,0,0-12.58,0L74.42,208l12.89-54.4a12,12,0,0,0-3.84-11.86L41.2,105.24l55.4-4.47a12,12,0,0,0,10.13-7.38L128,41.89l21.27,51.5a12,12,0,0,0,10.13,7.38l55.4,4.47Z"/>
    </svg>
  ),
  paperPlane: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M230.14,25.86a20,20,0,0,0-19.57-5.11l-.22.07L18.44,79a20,20,0,0,0-3.06,37.25L99,157l40.71,83.65a19.81,19.81,0,0,0,18,11.38c.57,0,1.15,0,1.73-.07A19.82,19.82,0,0,0,177,237.56L235.18,45.65a1.42,1.42,0,0,0,.07-.22A20,20,0,0,0,230.14,25.86ZM156.91,221.07l-34.37-70.64,46-45.95a12,12,0,0,0-17-17l-46,46L34.93,99.09,210,46Z"/>
    </svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,72a24,24,0,1,1,24-24A24,24,0,0,1,128,152ZM176,20H80A60.07,60.07,0,0,0,20,80v96a60.07,60.07,0,0,0,60,60h96a60.07,60.07,0,0,0,60-60V80A60.07,60.07,0,0,0,176,20Zm36,156a36,36,0,0,1-36,36H80a36,36,0,0,1-36-36V80A36,36,0,0,1,80,44h96a36,36,0,0,1,36,36ZM196,76a16,16,0,1,1-16-16A16,16,0,0,1,196,76Z"/>
    </svg>
  ),
  question: (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M144,180a16,16,0,1,1-16-16A16,16,0,0,1,144,180Zm92-52A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128ZM128,64c-24.26,0-44,17.94-44,40v4a12,12,0,0,0,24,0v-4c0-8.82,9-16,20-16s20,7.18,20,16-9,16-20,16a12,12,0,0,0-12,12v8a12,12,0,0,0,23.73,2.56C158.31,137.88,172,122.37,172,104,172,81.94,152.26,64,128,64Z"/>
    </svg>
  ),
}

// ─── Row ────────────────────────────────────────────────────────────────────

function Row({
  icon, label, value, valueDim, href, danger, last, external,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  valueDim?: boolean
  href: string
  danger?: boolean
  last?: boolean
  external?: boolean
}) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '13px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(45,42,62,0.06)',
      gap: 12,
    }}>
      {/* Icon box */}
      <div style={{
        width: 34, height: 34, minWidth: 34,
        borderRadius: 10,
        background: danger ? 'rgba(224,82,82,0.08)' : 'rgba(45,42,62,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? '#E05252' : '#7A7890',
      }}>
        {icon}
      </div>

      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px', fontWeight: 600,
        color: danger ? '#E05252' : '#1E1C2E',
        flex: 1,
      }}>
        {label}
      </span>

      {value && (
        <span style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px', fontWeight: 700,
          color: valueDim ? '#9895B0' : '#C86040',
          background: valueDim ? 'transparent' : 'rgba(244,165,130,0.10)',
          borderRadius: 6,
          padding: valueDim ? 0 : '3px 8px',
        }}>
          {value}
        </span>
      )}

      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M6 3L11 8L6 13" stroke="#C4C0D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </a>
  ) : (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '10px', fontWeight: 800,
        letterSpacing: '0.1em', color: '#9895B0',
        marginBottom: 8, paddingLeft: 2,
      }}>
        {title}
      </p>
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid rgba(45,42,62,0.07)',
        boxShadow: '0 2px 8px rgba(45,42,62,0.05)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Plan badge colors ───────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', starter: 'Starter', core: 'Core', companion: 'Companion',
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function MePage() {
  const { userId } = await auth()
  const user = await currentUser()
  const firstName   = user?.firstName ?? ''
  const lastName    = user?.lastName  ?? ''
  const email       = user?.emailAddresses?.[0]?.emailAddress ?? ''
  const avatar      = user?.hasImage ? user.imageUrl : null

  let planLabel   = 'Free'
  let displayName = [firstName, lastName].filter(Boolean).join(' ')

  if (userId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('profiles')
      .select('plan, display_name')
      .eq('clerk_user_id', userId)
      .single()
    if (data?.plan)                         planLabel   = PLAN_LABELS[data.plan] ?? 'Free'
    if (!displayName && data?.display_name) displayName = data.display_name
  }

  // Derive initial after all name sources have been resolved.
  // Fall back to first letter of email if name is still empty.
  const initial = (displayName || email || 'L')[0].toUpperCase()

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: '#FBF8F5', paddingBottom: 40 }}
    >
      {/* ── Profile hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, rgba(244,165,130,0.22) 0%, rgba(245,201,138,0.14) 55%, transparent 100%)',
        padding: '32px 20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>

        {/* Avatar — real photo if uploaded, otherwise gradient initial */}
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt="Avatar"
            style={{
              width: 60, height: 60, minWidth: 60,
              borderRadius: '50%', objectFit: 'cover',
              boxShadow: '0 2px 10px rgba(45,42,62,0.14)',
            }}
          />
        ) : (
          <div style={{
            width: 60, height: 60, minWidth: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
            boxShadow: '0 2px 10px rgba(244,165,130,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '22px', fontWeight: 800,
              color: '#1E1C2E',
              lineHeight: 1,
            }}>
              {initial}
            </span>
          </div>
        )}

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '19px', fontWeight: 800,
            color: '#1E1C2E', lineHeight: 1.2,
            marginBottom: 3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {displayName || 'Hey there'}
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px', fontWeight: 500, color: '#9895B0',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {email}
          </p>
        </div>

        {/* Edit button */}
        <Link href="/me/edit-profile" style={{
          flexShrink: 0,
          padding: '7px 14px',
          borderRadius: 10,
          background: 'rgba(45,42,62,0.06)',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px', fontWeight: 700,
          color: '#7A7890', textDecoration: 'none',
        }}>
          Edit
        </Link>
      </div>

      {/* ── Settings list ── */}
      <div style={{ padding: '24px 16px 0' }}>

        <Section title="YOU">
          <Row icon={icons.sparkle}   label="How Lumi addresses you"  href="/me/lumi-preferences" />
          <Row icon={icons.clipboard} label="Onboarding answers"       href="/me/onboarding"       last />
        </Section>

        <Section title="HEALTH">
          <Row icon={icons.pill} label="Medication log" href="/me/medication" />
          <Row icon={icons.moon} label="Sleep log"      href="/me/sleep"      last />
        </Section>

        <Section title="ACCOUNT">
          <Row icon={icons.crown}  label="Your plan"     value={planLabel} valueDim={planLabel === 'Free'} href="/me/subscription" />
          <Row icon={icons.bell}   label="Notifications"                   href="/me/notifications" />
          <Row icon={icons.trophy} label="Your wins"                       href="/me/wins"          last />
        </Section>

        <Section title="COMMUNITY">
          <Row icon={icons.paperPlane} label="Share feedback"       href="mailto:hey@lumimind.app"          external />
          <Row icon={icons.instagram}  label="Follow on Instagram"  href="https://instagram.com/lumiforadhd"         external />
          <Row icon={icons.question}   label="FAQ"                  href="https://lumimind.app/faq"                  external />
          <Row icon={icons.star}       label="Rate the app"         href="#" value="Coming soon" valueDim             last />
        </Section>

        <Section title="SUPPORT">
          <Row icon={icons.heart}  label="Crisis resources" href="/me/crisis"  />
          <Row icon={icons.chat}   label="Contact us"       href="/me/contact" />
          <Row icon={icons.info}   label="About Lumi"       href="/me/about"   />
          <Row icon={icons.logout} label="Sign out" danger  href="/sign-out"   last />
        </Section>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '11px', fontWeight: 500,
          color: 'rgba(45,42,62,0.22)',
          marginTop: 8,
        }}>
          Lumi · v0.1 · Built with care by Lumi Mind
        </p>

      </div>
    </div>
  )
}
