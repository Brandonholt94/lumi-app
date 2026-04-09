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

export default async function OnboardingPage() {
  const { userId } = await auth()

  // TODO: fetch actual onboarding answers from user_onboarding table when built
  // For now show placeholder state
  const hasAnswers = false

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="Onboarding answers" subtitle="How Lumi learned about you" />

      <div className="px-5">
        {!hasAnswers ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1E1C2E',
              marginBottom: 8,
            }}>
              Onboarding not yet complete
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#9895B0',
              lineHeight: 1.5,
              marginBottom: 20,
            }}>
              Lumi learns about you through a quick 7-question setup. This helps personalize everything — responses, nudges, and more.
            </p>
            <button style={{
              padding: '13px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 800,
              color: '#1E1C2E',
            }}>
              Start setup
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '20px',
          }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#9895B0',
            }}>
              Your answers will appear here once onboarding is complete.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
