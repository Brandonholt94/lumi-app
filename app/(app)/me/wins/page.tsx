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
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏆</p>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1E1C2E',
              marginBottom: 8,
            }}>
              No wins yet
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#9895B0',
              lineHeight: 1.5,
            }}>
              Complete your first task from Brain Dump and it&apos;ll show up here.
            </p>
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
