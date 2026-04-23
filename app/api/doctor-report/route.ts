import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — generate and email a report to the user's doctor
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch profile + doctor info
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, doctor_name, doctor_email, plan')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (profile?.plan?.toLowerCase() !== 'companion') {
    return NextResponse.json({ error: 'Companion plan required' }, { status: 403 })
  }

  if (!profile?.doctor_email) {
    return NextResponse.json({ error: 'No doctor email on file' }, { status: 400 })
  }

  const userName = profile.display_name ?? 'Your patient'

  // Gather 30-day data
  const [moodsRes, sleepRes, focusRes, habitsRes, medsRes] = await Promise.all([
    supabase
      .from('mood_logs')
      .select('mood, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('sleep_logs')
      .select('bedtime_hour, wake_hour, quality, created_at')
      .eq('clerk_user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('focus_sessions')
      .select('actual_duration, completed, started_at')
      .eq('clerk_user_id', userId)
      .gte('started_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('habit_logs')
      .select('habit_id, log_date')
      .eq('clerk_user_id', userId)
      .gte('log_date', thirtyDaysAgo.toISOString().slice(0, 10)),
    supabase
      .from('medications')
      .select('name, dosage, scheduled_time')
      .eq('clerk_user_id', userId),
  ])

  const moods = moodsRes.data ?? []
  const sleepLogs = sleepRes.data ?? []
  const focusSessions = focusRes.data ?? []
  const habitLogs = habitsRes.data ?? []
  const medications = medsRes.data ?? []

  // Compute averages
  const moodMap: Record<string, number> = { drained: 1, low: 2, okay: 3, bright: 4, wired: 5 }
  const moodScores = moods.map(m => moodMap[m.mood] ?? 3)
  const avgMood = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : 'N/A'

  const avgSleep = sleepLogs.length
    ? (sleepLogs.reduce((a, b) => {
        const { bedtime_hour, wake_hour } = b as { bedtime_hour: number; wake_hour: number }
        const hrs = wake_hour >= bedtime_hour
          ? wake_hour - bedtime_hour
          : 24 - bedtime_hour + wake_hour
        return a + hrs
      }, 0) / sleepLogs.length).toFixed(1)
    : 'N/A'

  const totalFocusMin = Math.round(focusSessions.reduce((a, b) => a + (b.actual_duration ?? 0), 0) / 60)
  const completedFocus = focusSessions.filter(s => s.completed).length

  const moodFreq: Record<string, number> = {}
  for (const m of moods) {
    moodFreq[m.mood] = (moodFreq[m.mood] ?? 0) + 1
  }
  const topMood = Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

  const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const periodStart = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lumi Health Summary — ${userName}</title>
</head>
<body style="margin:0;padding:0;background:#f8f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#F4A582,#F5C98A);border-radius:16px;padding:28px 28px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:rgba(30,28,46,0.6);text-transform:uppercase;">LUMI HEALTH SUMMARY</p>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#1E1C2E;line-height:1.2;">${userName}</h1>
      <p style="margin:0;font-size:13px;color:rgba(30,28,46,0.65);">30-day report · ${periodStart} – ${reportDate}</p>
    </div>

    <!-- Note to doctor -->
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #F4A582;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Note to Provider</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#2D2A3E;">
        This summary was generated by Lumi, an ADHD companion app used by ${userName}. The data below reflects self-reported mood, sleep, focus, and habit tracking over the past 30 days. This is not a clinical assessment — it is intended to supplement your conversation with the patient.
      </p>
    </div>

    <!-- Stats grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

      <div style="background:white;border-radius:12px;padding:18px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Avg Mood</p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#1E1C2E;">${avgMood}<span style="font-size:14px;font-weight:500;color:#9895B0;">/5</span></p>
        <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">Most common: <strong>${topMood}</strong></p>
        <p style="margin:2px 0 0;font-size:11px;color:#B0ACCA;">${moods.length} check-ins logged</p>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Avg Sleep</p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#1E1C2E;">${avgSleep}<span style="font-size:14px;font-weight:500;color:#9895B0;">hrs</span></p>
        <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">${sleepLogs.length} nights logged</p>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Focus Sessions</p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#1E1C2E;">${focusSessions.length}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">${completedFocus} completed · ${Math.round(totalFocusMin / 60)}h total</p>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Habit Check-ins</p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#1E1C2E;">${habitLogs.length}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">across 30 days</p>
      </div>

    </div>

    <!-- Medications -->
    ${medications.length > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9895B0;text-transform:uppercase;">Medications on File</p>
      ${medications.map(m => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(45,42,62,0.06);">
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#1E1C2E;">${m.name}${m.dosage ? ` — ${m.dosage}` : ''}</p>
            ${m.scheduled_time ? `<p style="margin:2px 0 0;font-size:12px;color:#9895B0;">Scheduled: ${m.scheduled_time}</p>` : ''}
          </div>
        </div>
      `).join('')}
      <p style="margin:10px 0 0;font-size:11px;color:#B0ACCA;">Self-reported by patient in Lumi app. Not verified for compliance.</p>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;">
      <p style="margin:0;font-size:12px;color:#B0ACCA;line-height:1.6;">
        Generated by <strong>Lumi</strong> · lumimind.app<br>
        Sent by ${userName} on ${reportDate}<br>
        This report contains self-reported data and is not a medical record.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()

  try {
    await resend.emails.send({
      from: 'Lumi <reports@lumimind.app>',
      to: profile.doctor_email,
      replyTo: undefined,
      subject: `Lumi Health Summary — ${userName} (${reportDate})`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email failed'
    console.error('[doctor-report]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
