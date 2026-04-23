import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import MoodSelector from './_components/MoodSelector'
import OneFocusCard from './_components/OneFocusCard'
import LumiNudge from './_components/LumiNudge'
import EveningBrainClear from './_components/EveningBrainClear'
import Link from 'next/link'
import DaySceneHeader from './_components/DaySceneHeader'
import WelcomeBack from './_components/WelcomeBack'
import MedCheckIn from './_components/MedCheckIn'
import SleepCard from './_components/SleepCard'
import ActionCards from './_components/ActionCards'
import MorningAnchors from './_components/MorningAnchors'
import DayTimeline from './_components/DayTimeline'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function TodayPage() {
  const { userId } = await auth()

  let firstName = 'Friend'
  let plan = 'core'
  if (userId) {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name, plan')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (data?.display_name) firstName = data.display_name
    plan = data?.plan ?? 'core'
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5' }}>

      {/* ── Day scene header ── */}
      <DaySceneHeader firstName={firstName} />

      {/* ── Body ── */}
      <div className="flex flex-col px-5 pb-8" style={{ background: '#FBF8F5', paddingTop: 28 }}>

        {/* Re-entry banner — shows after 24h away */}
        <WelcomeBack />

        {/* Medication check-in — time-aware */}
        <MedCheckIn />

        {/* Sleep card — shows last night's log or prompt */}
        <SleepCard />

        {/* ── HOW'S YOUR BRAIN TODAY? ── */}
        <p
          className="mb-[9px]"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
          }}
        >
          HOW&apos;S YOUR BRAIN TODAY?
        </p>
        <MoodSelector />

        {/* ── MORNING ANCHORS ── */}
        <MorningAnchors />

        {/* ── YOUR DAY — visual calendar timeline ── */}
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
            marginBottom: 9,
          }}
        >
          YOUR DAY
        </p>
        <DayTimeline plan={plan} />

        {/* Evening wind-down — shows after 8pm, right below the day view */}
        <EveningBrainClear />

        {/* ── ONE FOCUS (label + card rendered together inside OneFocusCard) ── */}
        <OneFocusCard />

        {/* Lumi contextual nudge — context-aware, replaces Heads Up alert */}
        <LumiNudge firstName={firstName} plan={plan} />

        {/* ── QUICK ACTIONS ── */}
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#9895B0',
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          QUICK ACTIONS
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link href="/focus" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
            background: 'rgba(245,201,138,0.16)', border: '1.5px solid rgba(245,201,138,0.36)',
            borderRadius: 20, boxShadow: '0 2px 8px rgba(245,201,138,0.12)', padding: '16px 14px 14px',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,201,138,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="13.5" r="7.5" stroke="#C49820" strokeWidth="1.8"/>
                <path d="M12 10V13.8L14.2 15.2" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.5 3H14.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 3V5.5" stroke="#C49820" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>Focus</span>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>Start a session</span>
          </Link>

          <Link href="/capture" className="flex flex-col items-start active:scale-[0.97] transition-transform" style={{
            background: 'rgba(232,160,191,0.14)', border: '1.5px solid rgba(232,160,191,0.34)',
            borderRadius: 20, boxShadow: '0 2px 8px rgba(232,160,191,0.10)', padding: '16px 14px 14px',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,160,191,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 256 256">
                <path fill="#B86090" d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-aegora)', fontSize: '16px', fontWeight: 700, color: '#1E1C2E', marginBottom: 3, lineHeight: 1.2 }}>Brain Dump</span>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 500, color: '#9895B0' }}>Clear your head</span>
          </Link>
        </div>

        {/* ── Talk to Lumi ── */}
        <Link href="/chat" className="flex items-center active:scale-[0.98] transition-transform mb-2" style={{
          background: 'linear-gradient(135deg, rgba(244,165,130,0.18) 0%, rgba(245,201,138,0.14) 100%)',
          border: '1.5px solid rgba(244,165,130,0.30)', borderRadius: 20,
          boxShadow: '0 2px 10px rgba(244,165,130,0.14)', padding: '16px 18px', gap: 16, textDecoration: 'none',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #F4A582, #F5C98A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(244,165,130,0.30)' }}>
            <svg width="28" height="25" viewBox="0 0 166.9 151.3" fill="none">
              <circle cx="83.8" cy="91" r="37.5" fill="white" />
              <rect x="37.7" y="30.8" width="12.3" height="27.8" rx="4.9" ry="4.9" transform="translate(-18.5 38.7) rotate(-40)" fill="white" />
              <rect x="77.6" y="10.4" width="12.3" height="33.9" rx="4.9" ry="4.9" fill="white" />
              <rect x="14.9" y="61.5" width="13.2" height="24.7" rx="5.2" ry="5.2" transform="translate(-55.4 74.1) rotate(-74)" fill="white" />
              <rect x="132.6" y="67.3" width="24.7" height="13.2" rx="5.2" ry="5.2" transform="translate(-14.7 42.8) rotate(-16)" fill="white" />
              <rect x="108.6" y="38.6" width="27.8" height="12.3" rx="4.9" ry="4.9" transform="translate(9.5 109.8) rotate(-50)" fill="white" />
              <rect x="10" y="133.4" width="147.6" height="7.9" rx="3.1" ry="3.1" fill="white" opacity="0.75" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-aegora)', fontSize: '17px', fontWeight: 700, color: '#1E1C2E', marginBottom: 2, lineHeight: 1.2 }}>Talk to Lumi</p>
            <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 500, color: '#9895B0' }}>167 hours a week — whenever you need</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(244,165,130,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Setup nudge cards — notifications, calendar, download (below the fold) */}
        <ActionCards plan={plan} />

      </div>{/* end body */}
    </div>
  )
}
