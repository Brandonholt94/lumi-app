import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import MeHeader from '../_components/MeHeader'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default async function WinsPage() {
  const { userId } = await auth()

  let wins: { id: string; text: string; created_at: string }[] = []

  if (userId) {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('captures')
      .select('id, text, created_at')
      .eq('clerk_user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(50)

    wins = data ?? []
  }

  // Group by date
  const grouped: Record<string, typeof wins> = {}
  for (const w of wins) {
    const label = formatDate(w.created_at)
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(w)
  }
  const groups = Object.entries(grouped)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Your wins" subtitle={`${wins.length} ${wins.length === 1 ? 'task' : 'tasks'} completed`} />

      <div className="px-5">

        {wins.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'white', borderRadius: 20,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '40px 28px 36px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(245,201,138,0.18), rgba(244,165,130,0.14))',
              border: '1.5px solid rgba(245,201,138,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width="28" height="28" viewBox="0 0 256 256" fill="rgba(200,160,48,0.75)">
                <path d="M232,60H212V48a12,12,0,0,0-12-12H56A12,12,0,0,0,44,48V60H24A20,20,0,0,0,4,80V96a44.05,44.05,0,0,0,44,44h.77A84.18,84.18,0,0,0,116,195.15V212H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24H140V195.11c30.94-4.51,56.53-26.2,67-55.11h1a44.05,44.05,0,0,0,44-44V80A20,20,0,0,0,232,60ZM28,96V84H44v28c0,1.21,0,2.41.09,3.61A20,20,0,0,1,28,96Zm160,15.1c0,33.33-26.71,60.65-59.54,60.9A60,60,0,0,1,68,112V60H188ZM228,96a20,20,0,0,1-16.12,19.62c.08-1.5.12-3,.12-4.52V84h16Z"/>
              </svg>
            </div>
            <p style={{
              fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700,
              color: '#1E1C2E', marginBottom: 10, lineHeight: 1.2,
            }}>
              No wins yet — but they&apos;re coming
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500,
              color: '#9895B0', lineHeight: 1.6, marginBottom: 24, maxWidth: '230px',
            }}>
              Every task you check off in Brain Dump shows up here. Even the small stuff. Especially the small stuff.
            </p>
            <Link
              href="/capture"
              style={{
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800,
                color: '#F4A582',
                background: 'rgba(244,165,130,0.10)',
                border: '1.5px solid rgba(244,165,130,0.25)',
                borderRadius: 12,
                padding: '10px 20px',
                textDecoration: 'none',
              }}
            >
              Go to Brain Dump →
            </Link>
          </div>
        ) : (
          groups.map(([dateLabel, items]) => (
            <div key={dateLabel} style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#9895B0',
                marginBottom: 8,
                paddingLeft: 4,
              }}>
                {dateLabel.toUpperCase()}
              </p>
              <div style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid rgba(45,42,62,0.07)',
                overflow: 'hidden',
              }}>
                {items.map((win, i) => (
                  <div key={win.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 16px',
                    borderBottom: i < items.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none',
                    gap: 12,
                  }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(244,165,130,0.2), rgba(245,201,138,0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 12,
                    }}>
                      ✓
                    </span>
                    <p style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2D2A3E',
                      flex: 1,
                      lineHeight: 1.4,
                    }}>
                      {win.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  )
}
