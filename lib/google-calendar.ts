import { createClient } from '@supabase/supabase-js'

const GOOGLE_AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CALENDAR_API     = 'https://www.googleapis.com/calendar/v3'
const USERINFO_API     = 'https://www.googleapis.com/oauth2/v3/userinfo'
const SCOPES           = 'https://www.googleapis.com/auth/calendar.readonly'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── OAuth URL ─────────────────────────────────────────────────
export function buildOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent', // always returns refresh_token
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

// ── Token exchange ────────────────────────────────────────────
export async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  return res.json()
}

// ── Token refresh ─────────────────────────────────────────────
async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  return res.json()
}

// ── Get valid access token (auto-refresh if near expiry) ──────
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('clerk_user_id', userId)
    .single()

  if (!data) return null

  const now    = new Date()
  const expiry = new Date(data.token_expiry)

  // Refresh if token expires within 5 minutes
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(data.refresh_token)
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

    return refreshed.access_token
  }

  return data.access_token
}

// ── Events ────────────────────────────────────────────────────
export interface CalendarEvent {
  id:     string
  title:  string
  start:  string // ISO string
  end:    string
  allDay: boolean
}

export async function getUpcomingEvents(
  userId: string,
  hours = 24
): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return []

  const now    = new Date()
  const timeMax = new Date(now.getTime() + hours * 60 * 60 * 1000)

  const params = new URLSearchParams({
    timeMin:       now.toISOString(),
    timeMax:       timeMax.toISOString(),
    singleEvents:  'true',
    orderBy:       'startTime',
    maxResults:    '5',
  })

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return []

    const data  = await res.json()
    const items = data.items ?? []

    return items.map((item: Record<string, unknown>) => {
      const start = item.start as Record<string, string> | undefined
      const end   = item.end   as Record<string, string> | undefined
      return {
        id:     item.id as string,
        title:  (item.summary as string) ?? 'Event',
        start:  start?.dateTime ?? start?.date ?? '',
        end:    end?.dateTime   ?? end?.date   ?? '',
        allDay: !start?.dateTime,
      }
    })
  } catch {
    return []
  }
}

// ── Connection status ─────────────────────────────────────────
export async function isCalendarConnected(userId: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('clerk_user_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()
  return !!data
}

export async function getConnectedEmail(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('google_email')
    .eq('clerk_user_id', userId)
    .maybeSingle()
  return data?.google_email ?? null
}

// ── Fetch Google account email after auth ─────────────────────
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const res  = await fetch(USERINFO_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.email ?? null
  } catch {
    return null
  }
}
