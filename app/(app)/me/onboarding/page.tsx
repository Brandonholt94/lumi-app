import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MeHeader from '../_components/MeHeader'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ADHD_IDENTITY_LABELS: Record<string, string> = {
  'diagnosed':       'Formally diagnosed',
  'self-identified': 'Pretty sure I have it',
  'exploring':       'Still figuring it out',
  'loved-one':       'Supporting someone I love',
}

const STRUGGLE_LABELS: Record<string, string> = {
  'starting':   'Getting started on things',
  'time':       'Losing track of time',
  'overwhelm':  'Feeling overwhelmed and shutting down',
  'emotional':  'Emotional spirals',
  'forgetting': 'Forgetting things that matter',
  'all':        'Honestly? All of it',
}

const HARDEST_TIME_LABELS: Record<string, string> = {
  'morning':       'Mornings — getting going',
  'afternoon':     'Afternoons — staying on track',
  'evening':       'Evenings — winding down',
  'unpredictable': 'No pattern — whenever a spiral hits',
}

const SUPPORT_LABELS: Record<string, string> = {
  'therapist':  'Yes — therapist or coach',
  'medication': 'Yes — medication',
  'waitlist':   'No — on a waitlist',
  'alone':      'No — figuring it out alone',
}

const TONE_LABELS: Record<string, string> = {
  'warm':     'Warm and gentle',
  'direct':   'Direct and to the point',
  'balanced': 'Somewhere in between',
}

interface Answer {
  label: string
  value: string
  display: string
}

function Row({ label, display }: { label: string; display: string }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: '1px solid rgba(45,42,62,0.06)',
    }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: '#9895B0',
        marginBottom: 4,
      }}>
        {label.toUpperCase()}
      </p>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1E1C2E',
        lineHeight: 1.4,
      }}>
        {display}
      </p>
    </div>
  )
}

export default async function OnboardingPage() {
  const { userId } = await auth()

  let answers: Answer[] = []
  let completed = false

  if (userId) {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name, adhd_identity, biggest_struggle, hardest_time, support_situation, tone_preference, onboarding_completed_at')
      .eq('clerk_user_id', userId)
      .single()

    if (data?.onboarding_completed_at) {
      completed = true
      answers = [
        data.display_name && {
          label: 'What Lumi calls you',
          value: 'display_name',
          display: data.display_name,
        },
        data.adhd_identity && {
          label: 'ADHD identity',
          value: 'adhd_identity',
          display: ADHD_IDENTITY_LABELS[data.adhd_identity] ?? data.adhd_identity,
        },
        data.biggest_struggle && {
          label: 'Biggest daily challenge',
          value: 'biggest_struggle',
          display: STRUGGLE_LABELS[data.biggest_struggle] ?? data.biggest_struggle,
        },
        data.hardest_time && {
          label: 'Hardest time of day',
          value: 'hardest_time',
          display: HARDEST_TIME_LABELS[data.hardest_time] ?? data.hardest_time,
        },
        data.support_situation && {
          label: 'Current support',
          value: 'support_situation',
          display: SUPPORT_LABELS[data.support_situation] ?? data.support_situation,
        },
        data.tone_preference && {
          label: 'How Lumi shows up',
          value: 'tone_preference',
          display: TONE_LABELS[data.tone_preference] ?? data.tone_preference,
        },
      ].filter(Boolean) as Answer[]
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>
      <MeHeader title="Onboarding answers" subtitle="How Lumi learned about you" />

      <div className="px-5" style={{ paddingTop: 20 }}>
        {completed && answers.length > 0 ? (
          <>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#9895B0',
              marginBottom: 14,
              lineHeight: 1.5,
            }}>
              These answers shape how Lumi talks to you and what it notices. You can retake setup anytime.
            </p>
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid rgba(45,42,62,0.07)',
              overflow: 'hidden',
              marginBottom: 20,
            }}>
              {answers.map((a, i) => (
                <div key={a.value} style={{ borderBottom: i < answers.length - 1 ? '1px solid rgba(45,42,62,0.06)' : 'none' }}>
                  <Row label={a.label} display={a.display} />
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(244,165,130,0.07)',
              border: '1.5px solid rgba(244,165,130,0.18)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>✦</span>
              <p style={{
                fontFamily: 'var(--font-nunito-sans)',
                fontSize: '12px',
                fontWeight: 500,
                color: '#2D2A3E',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </strong>
                These answers live in the background of every conversation. I remember them so you don&apos;t have to repeat yourself.
              </p>
            </div>
          </>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(45,42,62,0.07)',
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '17px',
              fontWeight: 800,
              color: '#1E1C2E',
              marginBottom: 8,
            }}>
              Setup not yet complete
            </p>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#9895B0',
              lineHeight: 1.5,
              marginBottom: 20,
            }}>
              Lumi learns about you through a quick setup. This helps personalize everything — responses, nudges, and more.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
