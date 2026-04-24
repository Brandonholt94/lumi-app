import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import DaySceneHeader from './_components/DaySceneHeader'
import MoodSelector from './_components/MoodSelector'
import DayTimeline from './_components/DayTimeline'
import DesktopCalendar from './_components/DesktopCalendar'
import TodaySideCards from './_components/TodaySideCards'

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
    <>
      <div className="lumi-today-root">

        {/* ════ SCENE HEADER — full width above both columns ════ */}
        <DaySceneHeader firstName={firstName} />

        {/* ════ TWO-COLUMN BODY ════ */}
        <div className="lumi-today-body">

          {/* ════ LEFT COLUMN — 70% desktop / full-width mobile ════ */}
          <div className="lumi-today-left">

            {/* ── DESKTOP: 3-day calendar + mood (left column only) ── */}
            <div className="lumi-today-desktop-col">
              <p className="lumi-section-label" style={{ marginBottom: 12 }}>YOUR WEEK</p>
              <DesktopCalendar plan={plan} />
            </div>

            {/* ── MOBILE: mood + timeline, then shared side cards ── */}
            <div className="mobile-only" style={{ padding: '4px 20px 40px' }}>
              <p className="lumi-section-label">HOW&apos;S YOUR BRAIN TODAY?</p>
              <MoodSelector />

              <p className="lumi-section-label" style={{ marginTop: 4 }}>YOUR DAY</p>
              <DayTimeline plan={plan} />

              {/* Same cards, same rules — just mobile sizing */}
              <TodaySideCards firstName={firstName} plan={plan} />
            </div>

          </div>{/* end lumi-today-left */}

          {/* ════ RIGHT COLUMN — 30% desktop only ════ */}
          <div className="lumi-today-right">
            <div style={{ padding: '20px 22px 40px', display: 'flex', flexDirection: 'column' }}>

              {/* Same cards, same rules — desktop sizing */}
              <TodaySideCards firstName={firstName} plan={plan} desktop />

            </div>
          </div>{/* end lumi-today-right */}

        </div>{/* end lumi-today-body */}

      </div>

    </>
  )
}
