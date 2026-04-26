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

// ── Mood metadata ──────────────────────────────────────────────────────────
const MOOD_META: Record<string, { label: string; color: string; score: number }> = {
  drained: { label: 'Drained', color: '#8FAAE0', score: 1 },
  low:     { label: 'Low',     color: '#E8A0BF', score: 2 },
  okay:    { label: 'Okay',    color: '#B0ACCA', score: 3 },
  bright:  { label: 'Bright',  color: '#F4A582', score: 4 },
  wired:   { label: 'Wired',   color: '#F5C98A', score: 5 },
}
const MOOD_ORDER = ['drained', 'low', 'okay', 'bright', 'wired']

// ── Build vertical mood bar chart (table-based, email-safe) ───────────────
function buildMoodBarsHtml(moodFreq: Record<string, number>, total: number): string {
  if (total === 0) {
    return '<p style="margin:0;font-size:13px;color:#9895B0;text-align:center;padding:16px 0;">No mood check-ins logged in this period.</p>'
  }

  const maxCount = Math.max(...MOOD_ORDER.map(m => moodFreq[m] ?? 0), 1)
  const BAR_MAX = 72 // px

  const barCells = MOOD_ORDER.map(mood => {
    const meta  = MOOD_META[mood]
    const count = moodFreq[mood] ?? 0
    const height = count > 0 ? Math.max(6, Math.round((count / maxCount) * BAR_MAX)) : 3
    const pct   = total > 0 ? Math.round((count / total) * 100) : 0
    return `
      <td style="width:20%;text-align:center;vertical-align:bottom;padding:0 5px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9895B0;">${pct}%</p>
        <div style="background:${meta.color};border-radius:5px 5px 0 0;height:${height}px;margin:0 auto;max-width:36px;opacity:${count > 0 ? '1' : '0.18'};"></div>
      </td>`
  }).join('')

  const labelCells = MOOD_ORDER.map(mood => {
    const meta  = MOOD_META[mood]
    const count = moodFreq[mood] ?? 0
    return `
      <td style="width:20%;text-align:center;padding:6px 3px 0;vertical-align:top;">
        <div style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${meta.color};margin-bottom:3px;"></div>
        <p style="margin:0;font-size:11px;font-weight:600;color:#6B6885;line-height:1.3;">${meta.label}<br>
          <strong style="font-size:13px;color:#1E1C2E;">${count}x</strong>
        </p>
      </td>`
  }).join('')

  return `
    <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #F0EDE8;padding-bottom:4px;">
      <tr style="vertical-align:bottom;">${barCells}</tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-top:0;">
      <tr>${labelCells}</tr>
    </table>`
}

// ── Build medications section ──────────────────────────────────────────────
function buildMedicationsHtml(medications: Array<{ name: string; dosage?: string; scheduled_time?: string }>): string {
  if (medications.length === 0) return ''
  const rows = medications.map((m, i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:${i < medications.length - 1 ? '1px solid #F0EDE8' : 'none'};">
        <p style="margin:0;font-size:14px;font-weight:700;color:#1E1C2E;">${m.name}${m.dosage ? `<span style="font-weight:500;color:#9895B0;"> · ${m.dosage}</span>` : ''}</p>
        ${m.scheduled_time ? `<p style="margin:2px 0 0;font-size:12px;color:#9895B0;">Scheduled: ${m.scheduled_time}</p>` : ''}
      </td>
    </tr>`).join('')

  return `
    <div style="background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:18px;">
      <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">💊 Medications on File</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin:10px 0 0;font-size:11px;color:#B0ACCA;line-height:1.5;">Self-reported by patient. Not verified for compliance or adherence.</p>
    </div>`
}

// ── Build the full HTML email ──────────────────────────────────────────────
function buildDoctorReportHtml(opts: {
  userName:      string
  reportDate:    string
  periodStart:   string
  avgMood:       string
  topMood:       string
  moodCount:     number
  moodBarsHtml:  string
  avgSleep:      string
  sleepNights:   number
  focusTotal:    number
  focusCompleted: number
  focusHours:    string
  habitCount:    number
  activeDays:    number
  medications:   Array<{ name: string; dosage?: string; scheduled_time?: string }>
}): string {
  const { userName, reportDate, periodStart, avgMood, topMood, moodCount,
          moodBarsHtml, avgSleep, sleepNights, focusTotal, focusCompleted,
          focusHours, habitCount, activeDays, medications } = opts

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Lumi Health Summary — ${userName}</title>
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'Nunito Sans',Nunito,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px 40px;">

  <!-- ── HEADER ── -->
  <div style="background:linear-gradient(135deg,#F4A582 0%,#F5C98A 55%,#E8A0BF 100%);border-radius:20px;padding:36px 32px 30px;margin-bottom:20px;">
    <!-- Lumi wordmark -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <tr>
        <td>
          <span style="font-size:20px;font-weight:800;color:#1E1C2E;letter-spacing:-0.3px;">Lumi</span><br>
          <span style="font-size:10px;font-weight:700;color:rgba(30,28,46,0.5);letter-spacing:0.14em;text-transform:uppercase;">ADHD Companion App</span>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="display:inline-block;background:rgba(30,28,46,0.12);border-radius:20px;padding:5px 13px;">
            <span style="font-size:10px;font-weight:700;color:rgba(30,28,46,0.6);letter-spacing:0.09em;text-transform:uppercase;">Health Summary</span>
          </div>
        </td>
      </tr>
    </table>
    <!-- Patient info -->
    <h1 style="margin:0 0 5px;font-size:28px;font-weight:800;color:#1E1C2E;line-height:1.1;">${userName}</h1>
    <p style="margin:0;font-size:13px;color:rgba(30,28,46,0.58);font-weight:500;">${periodStart} – ${reportDate} &nbsp;·&nbsp; 30-day window</p>
  </div>

  <!-- ── NOTE TO PROVIDER ── -->
  <div style="background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:18px;border-left:4px solid #F4A582;">
    <p style="margin:0 0 7px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">Note to Provider</p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:#2D2A3E;">
      This summary was generated by <strong>Lumi</strong>, an AI companion app designed for adults with ADHD. The data below reflects <strong>${userName}</strong>'s self-reported mood, sleep, focus, and habit tracking over the past 30 days. It is intended to enrich your clinical conversation — not replace it.
    </p>
  </div>

  <!-- ── MOOD SECTION ── -->
  <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;padding:0 4px;">Mood Check-ins &nbsp;·&nbsp; ${moodCount} logged</p>
  <div style="background:#fff;border-radius:14px;padding:22px 22px 18px;margin-bottom:18px;">
    ${moodBarsHtml}
    <table style="width:100%;border-collapse:collapse;margin-top:14px;">
      <tr>
        <td style="width:50%;padding-right:6px;">
          <div style="background:#F8F5F2;border-radius:10px;padding:12px 14px;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Average Score</p>
            <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${avgMood}<span style="font-size:13px;font-weight:500;color:#9895B0;">&nbsp;/ 5</span></p>
            <p style="margin:3px 0 0;font-size:11px;color:#B0ACCA;">1 = Drained · 5 = Wired</p>
          </div>
        </td>
        <td style="width:50%;padding-left:6px;">
          <div style="background:#F8F5F2;border-radius:10px;padding:12px 14px;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Most Common Mood</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#1E1C2E;line-height:1.2;text-transform:capitalize;">${topMood}</p>
            <p style="margin:3px 0 0;font-size:11px;color:#B0ACCA;">across ${moodCount} check-ins</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── STATS GRID ── -->
  <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;padding:0 4px;">Health Metrics</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
    <tr>
      <td style="width:50%;padding-right:6px;vertical-align:top;padding-bottom:12px;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Sleep</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${avgSleep}<span style="font-size:13px;font-weight:500;color:#9895B0;">&nbsp;hrs</span></p>
          <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">avg per night · ${sleepNights} nights logged</p>
        </div>
      </td>
      <td style="width:50%;padding-left:6px;vertical-align:top;padding-bottom:12px;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Focus Sessions</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${focusTotal}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">${focusCompleted} completed · ${focusHours}h total</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="width:50%;padding-right:6px;vertical-align:top;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Habit Check-ins</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${habitCount}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">logged over 30 days</p>
        </div>
      </td>
      <td style="width:50%;padding-left:6px;vertical-align:top;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">Active Days</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${activeDays}<span style="font-size:13px;font-weight:500;color:#9895B0;">&nbsp;/ 30</span></p>
          <p style="margin:4px 0 0;font-size:12px;color:#9895B0;">days with any logged data</p>
        </div>
      </td>
    </tr>
  </table>

  <!-- ── MEDICATIONS ── -->
  ${buildMedicationsHtml(medications)}

  <!-- ── CLINICAL DISCLAIMER ── -->
  <div style="background:#F8F5F2;border-radius:14px;padding:18px 20px;margin-bottom:22px;border:1px solid rgba(45,42,62,0.07);">
    <p style="margin:0 0 7px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">Important Note</p>
    <p style="margin:0;font-size:12px;line-height:1.7;color:#6B6885;">
      All data in this report is self-reported by ${userName} through the Lumi app and has not been independently verified. Mood scores use a 1–5 scale (1 = Drained · 3 = Okay · 5 = Wired). Sleep duration is derived from self-reported bedtime and wake time. Focus sessions are user-initiated. This report does not constitute a medical record and should not replace clinical assessment.
    </p>
  </div>

  <!-- ── DOCTOR CTA ── -->
  <div style="background:linear-gradient(135deg,#1E1C2E 0%,#2D2A3E 100%);border-radius:18px;padding:30px 28px;text-align:center;margin-bottom:22px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">For Clinicians</p>
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#F4A582;line-height:1.25;">ADHD patients need support between appointments.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;">Lumi gives your patients 24/7 mood tracking, focus tools, medication reminders, and emotional check-ins — all designed for the ADHD brain. It's free to recommend and takes 30 seconds.</p>
    <table style="margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding-right:10px;">
          <a href="https://lumimind.app?ref=doctor-report" style="display:inline-block;background:linear-gradient(135deg,#F4A582,#F5C98A);color:#1E1C2E;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:13px;font-weight:800;">Learn about Lumi →</a>
        </td>
        <td>
          <a href="https://lumimind.app/for-providers?ref=doctor-report" style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);text-decoration:none;padding:12px 22px;border-radius:12px;font-size:13px;font-weight:700;border:1px solid rgba(255,255,255,0.15);">Resources for providers</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── FOOTER ── -->
  <div style="text-align:center;padding:4px 0;">
    <p style="margin:0;font-size:12px;color:#B0ACCA;line-height:1.8;">
      Generated by <strong style="color:#9895B0;">Lumi</strong> &nbsp;·&nbsp; <a href="https://lumimind.app" style="color:#F4A582;text-decoration:none;">lumimind.app</a><br>
      Sent by ${userName} on ${reportDate}<br>
      This report contains self-reported data and is not a medical record.
    </p>
  </div>

</div>
</body>
</html>`
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch profile + doctor info
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, doctor_name, doctor_email, plan')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (profile?.plan?.toLowerCase() !== 'companion') {
    console.warn('[doctor-report] non-companion attempt', { userId, plan: profile?.plan })
    return NextResponse.json({ error: 'Companion plan required' }, { status: 403 })
  }

  if (!profile?.doctor_email) {
    return NextResponse.json({ error: 'No doctor email on file' }, { status: 400 })
  }

  const userName    = profile.display_name ?? 'Your patient'
  const reportDate  = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const periodStart = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  // ── Gather 30-day data ──
  const [moodsRes, sleepRes, focusRes, habitsRes, medsRes] = await Promise.all([
    supabase.from('mood_logs').select('mood, created_at').eq('clerk_user_id', userId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    supabase.from('sleep_logs').select('bedtime_hour, wake_hour, quality, created_at').eq('clerk_user_id', userId).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('focus_sessions').select('actual_duration, completed, started_at').eq('clerk_user_id', userId).gte('started_at', thirtyDaysAgo.toISOString()),
    supabase.from('habit_logs').select('habit_id, log_date').eq('clerk_user_id', userId).gte('log_date', thirtyDaysAgo.toISOString().slice(0, 10)),
    supabase.from('medications').select('name, dosage, scheduled_time').eq('clerk_user_id', userId),
  ])

  const moods          = moodsRes.data ?? []
  const sleepLogs      = sleepRes.data ?? []
  const focusSessions  = focusRes.data ?? []
  const habitLogs      = habitsRes.data ?? []
  const medications    = medsRes.data ?? []

  // ── Compute stats ──
  const moodFreq: Record<string, number> = {}
  for (const m of moods) moodFreq[m.mood] = (moodFreq[m.mood] ?? 0) + 1

  const moodMap: Record<string, number> = { drained: 1, low: 2, okay: 3, bright: 4, wired: 5 }
  const moodScores = moods.map(m => moodMap[m.mood] ?? 3)
  const avgMood    = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : 'N/A'
  const topMood = Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

  const avgSleep = sleepLogs.length
    ? (sleepLogs.reduce((a, b) => {
        const hrs = b.wake_hour >= b.bedtime_hour
          ? b.wake_hour - b.bedtime_hour
          : 24 - b.bedtime_hour + b.wake_hour
        return a + hrs
      }, 0) / sleepLogs.length).toFixed(1)
    : 'N/A'

  const totalFocusMin   = Math.round(focusSessions.reduce((a, b) => a + (b.actual_duration ?? 0), 0) / 60)
  const completedFocus  = focusSessions.filter(s => s.completed).length
  const focusHours      = (totalFocusMin / 60).toFixed(1)

  // Active days = distinct calendar days with any log
  const activeDaySet = new Set<string>()
  for (const m of moods) activeDaySet.add(m.created_at.slice(0, 10))
  for (const s of focusSessions) if (s.started_at) activeDaySet.add(s.started_at.slice(0, 10))
  for (const h of habitLogs) if (h.log_date) activeDaySet.add(h.log_date.slice(0, 10))
  const activeDays = activeDaySet.size

  const moodBarsHtml = buildMoodBarsHtml(moodFreq, moods.length)

  const html = buildDoctorReportHtml({
    userName, reportDate, periodStart,
    avgMood, topMood, moodCount: moods.length,
    moodBarsHtml,
    avgSleep, sleepNights: sleepLogs.length,
    focusTotal: focusSessions.length, focusCompleted: completedFocus, focusHours,
    habitCount: habitLogs.length,
    activeDays,
    medications,
  })

  try {
    console.log('[doctor-report] sending to', profile.doctor_email, { userId, userName })
    await resend.emails.send({
      from:    'Lumi <reports@lumimind.app>',
      to:      profile.doctor_email,
      subject: `Lumi Health Summary — ${userName} (${reportDate})`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email failed'
    console.error('[doctor-report] email send failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
