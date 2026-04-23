import { createClient } from '@supabase/supabase-js'
import type { CalendarEvent } from './google-calendar'

const MS_AUTH_URL  = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_API    = 'https://graph.microsoft.com/v1.0'
// offline_access is required for refresh tokens; openid+email for userinfo
const SCOPES       = 'Calendars.Read offline_access openid email'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── OAuth URL ─────────────────────────────────────────────────
export function buildMicrosoftOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         SCOPES,
    response_mode: 'query',
    prompt:        'consent',
  })
  return `${MS_AUTH_URL}?${params.toString()}`
}

// ── Token exchange ────────────────────────────────────────────
export async function exchangeMicrosoftCode(code: string, redirectUri: string) {
  const res = await fetch(MS_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
      scope:         SCOPES,
    }),
  })
  return res.json()
}

// ── Token refresh ─────────────────────────────────────────────
async function refreshMicrosoftToken(refreshToken: string) {
  const res = await fetch(MS_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      grant_type:    'refresh_token',
      scope:         SCOPES,
    }),
  })
  return res.json()
}

// ── Get valid access token (auto-refresh) ─────────────────────
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('clerk_user_id', userId)
    .eq('provider', 'microsoft')
    .maybeSingle()

  if (!data) return null

  const now    = new Date()
  const expiry = new Date(data.token_expiry)

  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshed = await refreshMicrosoftToken(data.refresh_token)
    if (refreshed.error) return null

    const newExpiry = new Date(now.getTime() + refreshed.expires_in * 1000)
    await supabase
      .from('calendar_tokens')
      .update({
        access_token: refreshed.access_token,
        token_expiry: newExpiry.toISOString(),
        updated_at:   now.toISOString(),
      })
      .eq('clerk_user_id', userId)
      .eq('provider', 'microsoft')

    return refreshed.access_token
  }

  return data.access_token
}

// ── Fetch Microsoft account email ─────────────────────────────
export async function fetchMicrosoftEmail(accessToken: string): Promise<string | null> {
  try {
    const res  = await fetch(`${GRAPH_API}/me?$select=mail,userPrincipalName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.mail ?? data.userPrincipalName ?? null
  } catch {
    return null
  }
}

// ── Upcoming events ───────────────────────────────────────────
export async function getMicrosoftUpcomingEvents(
  userId: string,
  hours = 24
): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return []

  const now        = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const timeMax    = new Date(now.getTime() + hours * 60 * 60 * 1000)

  const params = new URLSearchParams({
    startDateTime: startOfDay.toISOString(),
    endDateTime:   timeMax.toISOString(),
    '$orderby':    'start/dateTime',
    '$top':        '10',
    '$select':     'id,subject,start,end,isAllDay',
  })

  try {
    const res = await fetch(`${GRAPH_API}/me/calendarview?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer:        'outlook.timezone="UTC"',
      },
    })
    if (!res.ok) return []

    const data  = await res.json()
    const items = data.value ?? []

    return items.map((item: Record<string, unknown>) => {
      const start = item.start as Record<string, string> | undefined
      const end   = item.end   as Record<string, string> | undefined
      return {
        id:     item.id as string,
        title:  (item.subject as string) ?? 'Event',
        start:  start?.dateTime ? `${start.dateTime}Z` : '',
        end:    end?.dateTime   ? `${end.dateTime}Z`   : '',
        allDay: !!(item.isAllDay),
        source: 'microsoft' as const,
      }
    })
  } catch {
    return []
  }
}

// ── Connection status ─────────────────────────────────────────
export async function isMicrosoftConnected(userId: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('clerk_user_id')
    .eq('clerk_user_id', userId)
    .eq('provider', 'microsoft')
    .maybeSingle()
  return !!data
}

export async function getMicrosoftEmail(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('google_email')
    .eq('clerk_user_id', userId)
    .eq('provider', 'microsoft')
    .maybeSingle()
  return data?.google_email ?? null
}
