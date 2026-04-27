import { NextResponse } from 'next/server'
import { verifyCronAuth, getEligibleUsersForLocalHour, getServiceClient } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/push'
import { Resend } from 'resend'
import { clerkClient } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY!)

// ── Mood metadata ──────────────────────────────────────────────────────────
const MOOD_META: Record<string, { label: string; color: string; score: number }> = {
  drained: { label: 'Drained', color: '#8FAAE0', score: 1 },
  low:     { label: 'Low',     color: '#E8A0BF', score: 2 },
  okay:    { label: 'Okay',    color: '#B0ACCA', score: 3 },
  bright:  { label: 'Bright',  color: '#F4A582', score: 4 },
  wired:   { label: 'Wired',   color: '#F5C98A', score: 5 },
}
const MOOD_ORDER = ['drained', 'low', 'okay', 'bright', 'wired']

// ── Mood bar row (horizontal bar chart, email-safe) ────────────────────────
function buildWeeklyMoodRows(moodFreq: Record<string, number>, total: number): string {
  if (total === 0) return '<p style="margin:0;font-size:13px;color:#9895B0;">No mood check-ins this week.</p>'

  return MOOD_ORDER
    .filter(m => (moodFreq[m] ?? 0) > 0)
    .map(mood => {
      const meta   = MOOD_META[mood]
      const count  = moodFreq[mood] ?? 0
      const pct    = Math.round((count / total) * 100)
      const barPct = Math.max(4, pct)
      return `
        <tr>
          <td style="width:72px;padding:4px 10px 4px 0;font-size:12px;font-weight:600;color:#6B6885;vertical-align:middle;white-space:nowrap;">${meta.label}</td>
          <td style="padding:4px 8px 4px 0;vertical-align:middle;">
            <div style="background:${meta.color};border-radius:4px;height:14px;width:${barPct}%;min-width:6px;max-width:180px;"></div>
          </td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:#1E1C2E;white-space:nowrap;vertical-align:middle;">${count}× &nbsp;<span style="font-size:11px;font-weight:500;color:#9895B0;">(${pct}%)</span></td>
        </tr>`
    }).join('')
}

// ── Build the weekly brain report HTML email ──────────────────────────────
function buildWeeklyReportHtml(opts: {
  firstName:      string
  weekStart:      string
  weekEnd:        string
  moodFreq:       Record<string, number>
  moodTotal:      number
  avgMood:        string
  topMood:        string
  focusTotal:     number
  focusCompleted: number
  focusMinutes:   number
  captureTotal:   number
  captureDone:    number
  activeDays:     number
}): string {
  const { firstName, weekStart, weekEnd, moodFreq, moodTotal, avgMood, topMood,
          focusTotal, focusCompleted, focusMinutes, captureTotal, captureDone, activeDays } = opts

  const focusHours = (focusMinutes / 60).toFixed(1)
  const moodBarsHtml = buildWeeklyMoodRows(moodFreq, moodTotal)

  // Headline mood line
  const moodTopMeta  = MOOD_META[topMood]
  const moodHeadline = moodTotal === 0
    ? 'No mood check-ins this week.'
    : `Your most common mood was <strong style="color:${moodTopMeta?.color ?? '#F4A582'};">${topMood}</strong>${avgMood !== 'N/A' ? ` (avg ${avgMood}/5)` : ''}.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Weekly Brain Report · Lumi</title>
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'Nunito Sans',Nunito,Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:24px 16px 48px;">

  <!-- ── HEADER ── -->
  <div style="background:linear-gradient(135deg,#1E1C2E 0%,#2D2A3E 100%);border-radius:20px;padding:34px 30px 28px;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <tr>
        <td>
          <span style="font-size:18px;font-weight:800;color:#F4A582;letter-spacing:-0.3px;">Lumi</span><br>
          <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:0.14em;text-transform:uppercase;">Weekly Brain Report</span>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="display:inline-block;background:rgba(244,165,130,0.15);border-radius:20px;padding:5px 13px;">
            <span style="font-size:10px;font-weight:700;color:#F4A582;letter-spacing:0.08em;text-transform:uppercase;">📊 Weekly</span>
          </div>
        </td>
      </tr>
    </table>
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;line-height:1.15;">Hey ${firstName}! Here's your week.</h1>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);font-weight:500;">${weekStart} – ${weekEnd}</p>
  </div>

  <!-- ── QUICK WINS ── -->
  <div style="background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:14px;">
    <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">Your Week at a Glance</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:25%;text-align:center;padding:8px 4px;vertical-align:top;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#1E1C2E;">${activeDays}</p>
          <p style="margin:3px 0 0;font-size:11px;font-weight:600;color:#9895B0;">active<br>days</p>
        </td>
        <td style="width:25%;text-align:center;padding:8px 4px;vertical-align:top;border-left:1px solid #F0EDE8;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#1E1C2E;">${moodTotal}</p>
          <p style="margin:3px 0 0;font-size:11px;font-weight:600;color:#9895B0;">mood<br>check-ins</p>
        </td>
        <td style="width:25%;text-align:center;padding:8px 4px;vertical-align:top;border-left:1px solid #F0EDE8;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#1E1C2E;">${focusCompleted}</p>
          <p style="margin:3px 0 0;font-size:11px;font-weight:600;color:#9895B0;">focus<br>completed</p>
        </td>
        <td style="width:25%;text-align:center;padding:8px 4px;vertical-align:top;border-left:1px solid #F0EDE8;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#1E1C2E;">${captureDone}</p>
          <p style="margin:3px 0 0;font-size:11px;font-weight:600;color:#9895B0;">tasks<br>done</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── MOOD ── -->
  <div style="background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:14px;">
    <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#9895B0;text-transform:uppercase;">Mood Breakdown</p>
    <table style="border-collapse:collapse;width:100%;">
      ${moodBarsHtml}
    </table>
    ${moodTotal > 0 ? `<p style="margin:14px 0 0;font-size:13px;color:#2D2A3E;line-height:1.6;">${moodHeadline}</p>` : ''}
  </div>

  <!-- ── FOCUS ── -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
    <tr>
      <td style="width:50%;padding-right:6px;vertical-align:top;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">🎯 Focus</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${focusTotal}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#9895B0;">${focusCompleted} completed · ${focusHours}h</p>
        </div>
      </td>
      <td style="width:50%;padding-left:6px;vertical-align:top;">
        <div style="background:#fff;border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9895B0;text-transform:uppercase;">✍️ Captures</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#1E1C2E;line-height:1.1;">${captureTotal}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#9895B0;">${captureDone} marked done</p>
        </div>
      </td>
    </tr>
  </table>

  <!-- ── CTA ── -->
  <div style="background:linear-gradient(135deg,#F4A582 0%,#F5C98A 100%);border-radius:16px;padding:26px 24px;text-align:center;margin-bottom:22px;">
    <p style="margin:0 0 12px;font-size:16px;font-weight:800;color:#1E1C2E;line-height:1.3;">See the full picture in Lumi</p>
    <p style="margin:0 0 18px;font-size:13px;color:rgba(30,28,46,0.65);line-height:1.6;">Your insights page shows mood trends, focus patterns, and habit streaks — all in one place.</p>
    <a href="https://app.lumimind.app/insights" style="display:inline-block;background:#1E1C2E;color:#F4A582;text-decoration:none;padding:12px 26px;border-radius:12px;font-size:14px;font-weight:800;">Open my insights →</a>
  </div>

  <!-- ── SOFT REFERRAL ── -->
  <div style="background:#fff;border-radius:14px;padding:18px 22px;margin-bottom:22px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1E1C2E;">Know someone with ADHD who'd love this?</p>
    <p style="margin:0 0 12px;font-size:12px;color:#9895B0;line-height:1.6;">Lumi is free to try for 7 days. No shame, no streaks, no pressure.</p>
    <a href="https://lumimind.app?ref=weekly-report" style="font-size:12px;font-weight:700;color:#F4A582;text-decoration:none;">Share Lumi →</a>
  </div>

  <!-- ── FOOTER ── -->
  <div style="text-align:center;">
    <p style="margin:0;font-size:11px;color:#B0ACCA;line-height:1.8;">
      You're receiving this because you have weekly reports enabled in Lumi.<br>
      <a href="https://app.lumimind.app/me/notifications" style="color:#9895B0;text-decoration:underline;">Update your notification preferences</a>
      &nbsp;·&nbsp;
      <a href="https://lumimind.app" style="color:#9895B0;text-decoration:none;">lumimind.app</a>
    </p>
  </div>

</div>
</body>
</html>`
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  console.log('[weekly-report] cron fired at', new Date().toISOString())

  if (!verifyCronAuth(req)) {
    console.warn('[weekly-report] unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire for users where it's currently 9am Sunday in their local timezone
  const userIds = await getEligibleUsersForLocalHour('weekly_report', 9)
  console.log('[weekly-report] eligible users', userIds.length)
  if (userIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  const supabase = getServiceClient()
  const now = new Date()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Only notify users who actually have data this week — skip ghost accounts
  const { data: moodActive } = await supabase
    .from('mood_logs')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)
    .gte('created_at', sevenDaysAgo.toISOString())

  const activeIds = [...new Set((moodActive ?? []).map(r => r.clerk_user_id))]

  // Fall back to captures for users with no mood logs
  const inactiveIds = userIds.filter(id => !activeIds.includes(id))
  if (inactiveIds.length > 0) {
    const { data: captureActive } = await supabase
      .from('captures')
      .select('clerk_user_id')
      .in('clerk_user_id', inactiveIds)
      .gte('created_at', sevenDaysAgo.toISOString())
    activeIds.push(...new Set((captureActive ?? []).map(r => r.clerk_user_id)))
  }

  if (activeIds.length === 0) return NextResponse.json({ sent: 0, total: 0 })

  // Date strings for email
  const weekEnd   = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const weekStart = sevenDaysAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  // Fetch all data for active users in batch, then distribute per-user
  const [moodsRes, focusRes, capturesRes, profilesRes] = await Promise.all([
    supabase.from('mood_logs').select('clerk_user_id, mood, created_at').in('clerk_user_id', activeIds).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('focus_sessions').select('clerk_user_id, actual_duration, completed').in('clerk_user_id', activeIds).gte('started_at', sevenDaysAgo.toISOString()),
    supabase.from('captures').select('clerk_user_id, completed, created_at').in('clerk_user_id', activeIds).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('profiles').select('clerk_user_id, display_name, timezone').in('clerk_user_id', activeIds),
  ])

  const allMoods    = moodsRes.data    ?? []
  const allFocus    = focusRes.data    ?? []
  const allCaptures = capturesRes.data ?? []
  const profiles    = profilesRes.data ?? []

  // Build per-user lookup maps
  const profileMap: Record<string, { name: string; tz: string }> = {}
  for (const p of profiles) {
    profileMap[p.clerk_user_id] = {
      name: p.display_name ?? 'there',
      tz:   p.timezone ?? 'America/New_York',
    }
  }

  const moodMap: Record<string, number> = { drained: 1, low: 2, okay: 3, bright: 4, wired: 5 }

  // Clerk client for email addresses
  const clerk = await clerkClient()

  const results = await Promise.allSettled(
    activeIds.map(async (userId) => {
      // Per-user data
      const userMoods    = allMoods.filter(m => m.clerk_user_id === userId)
      const userFocus    = allFocus.filter(f => f.clerk_user_id === userId)
      const userCaptures = allCaptures.filter(c => c.clerk_user_id === userId)
      const info         = profileMap[userId] ?? { name: 'there', tz: 'America/New_York' }

      const moodFreq: Record<string, number> = {}
      for (const m of userMoods) moodFreq[m.mood] = (moodFreq[m.mood] ?? 0) + 1

      const moodScores = userMoods.map(m => moodMap[m.mood] ?? 3)
      const avgMood    = moodScores.length
        ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
        : 'N/A'
      const topMood = Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'okay'

      const focusMinutes  = Math.round(userFocus.reduce((a, b) => a + (b.actual_duration ?? 0), 0) / 60)
      const focusCompleted = userFocus.filter(f => f.completed).length

      // Active days
      const activeDaySet = new Set<string>()
      for (const m of userMoods)    activeDaySet.add(m.created_at.slice(0, 10))
      for (const c of userCaptures) activeDaySet.add(c.created_at.slice(0, 10))

      // First name
      const firstName = info.name.split(' ')[0] ?? 'there'

      // ── Generate AI narrative and store it ──────────────────────────────
      const byTag = { task: 0, idea: 0, worry: 0, reminder: 0 }
      for (const c of userCaptures) {
        const k = (c as Record<string, unknown>).tag as keyof typeof byTag
        if (k && k in byTag) byTag[k]++
      }

      const weekStartDate = new Date(now)
      weekStartDate.setDate(now.getDate() - 6)
      weekStartDate.setHours(0, 0, 0, 0)
      const weekStartStr = weekStartDate.toISOString().slice(0, 10)

      try {
        const sampleCaptures = userCaptures
          .slice(0, 10)
          .map(c => `- [${(c as Record<string, unknown>).tag ?? 'untagged'}] ${(c as Record<string, unknown>).text}`)
          .join('\n')

        const { text: reportText } = await generateText({
          model: anthropic('claude-sonnet-4.6'),
          prompt: `You are Lumi, a warm and deeply understanding AI companion built for adults with ADHD.

Write a Weekly Brain Report for this user. It's a short personal narrative — 3 paragraphs, around 150 words. Reflect on their week using the data below.

Lumi's voice rules:
- Warm, specific, human. Never clinical.
- Celebrate small wins. Never shame.
- Speak directly to the user ("you", "your brain").
- Never use the word "productivity", "just", or "chatbot".
- No bullet points. No headers. Pure prose.

WEEK DATA:
- Captures total: ${userCaptures.length}
- Tasks: ${byTag.task} | Ideas: ${byTag.idea} | Worries: ${byTag.worry} | Reminders: ${byTag.reminder}
- Mood check-ins: ${userMoods.length}${topMood ? ` (most common: ${topMood})` : ''}
- Focus sessions: ${userFocus.length} (${focusMinutes} min total)
- Active days: ${activeDaySet.size}

Sample captures this week (for context, do not quote directly):
${sampleCaptures || '(none yet)'}

Lead with something specific and human. End with one grounding observation for next week.`,
          maxOutputTokens: 400,
        })

        await supabase.from('weekly_brain_reports').upsert(
          { clerk_user_id: userId, week_start: weekStartStr, report_text: reportText.trim() },
          { onConflict: 'clerk_user_id,week_start' }
        )

        console.log('[weekly-report] stored AI report for', userId)
      } catch (err) {
        console.error('[weekly-report] AI report generation failed for', userId, err)
      }

      // Push notification — tell them it's ready
      void sendPushToUser(userId, {
        title: 'Your Weekly Brain Report is ready 📊',
        body:  `${firstName}, Lumi wrote your week up. Tap to read it.`,
        url:   '/insights',
      }).catch(() => {})

      // Email — get address from Clerk
      let email: string | null = null
      try {
        const clerkUser = await clerk.users.getUser(userId)
        email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null
      } catch (err) {
        console.warn('[weekly-report] could not fetch Clerk user', { userId, err })
      }

      if (!email) return

      const html = buildWeeklyReportHtml({
        firstName,
        weekStart,
        weekEnd,
        moodFreq,
        moodTotal:      userMoods.length,
        avgMood,
        topMood,
        focusTotal:     userFocus.length,
        focusCompleted,
        focusMinutes,
        captureTotal:   userCaptures.length,
        captureDone:    userCaptures.filter(c => c.completed).length,
        activeDays:     activeDaySet.size,
      })

      await resend.emails.send({
        from:    'Lumi <reports@lumimind.app>',
        to:      email,
        subject: `Your weekly brain report 📊 — ${weekStart}–${weekEnd}`,
        html,
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  console.log('[weekly-report] sent', sent, 'of', activeIds.length)
  return NextResponse.json({ sent, total: activeIds.length })
}
