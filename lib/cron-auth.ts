// Shared cron auth guard — all cron routes call this first
export function verifyCronAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

import { createClient } from '@supabase/supabase-js'

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Get all users who have a given notification pref enabled
// AND have at least one push subscription
export async function getEligibleUsers(prefKey: string): Promise<string[]> {
  const supabase = getServiceClient()

  const { data: prefRows } = await supabase
    .from('notification_preferences')
    .select('clerk_user_id')
    .eq(prefKey, true)

  if (!prefRows || prefRows.length === 0) return []

  const userIds = prefRows.map(r => r.clerk_user_id)

  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)

  if (!subRows || subRows.length === 0) return []

  return [...new Set(subRows.map(s => s.clerk_user_id))]
}

// Get eligible users whose LOCAL time matches targetHour (0-23).
// Crons run every hour in UTC — this filters to only the users
// for whom it's currently the right time in their timezone.
export async function getEligibleUsersForLocalHour(
  prefKey: string,
  targetHour: number
): Promise<string[]> {
  const supabase = getServiceClient()

  // Users with this pref enabled
  const { data: prefRows } = await supabase
    .from('notification_preferences')
    .select('clerk_user_id')
    .eq(prefKey, true)

  if (!prefRows || prefRows.length === 0) return []

  const userIds = prefRows.map(r => r.clerk_user_id)

  // Fetch their timezones from profiles
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('clerk_user_id, timezone')
    .in('clerk_user_id', userIds)

  if (!profileRows || profileRows.length === 0) return []

  // Filter to users where it's currently targetHour in their local timezone
  const now = new Date()
  const matchingUserIds = profileRows
    .filter(p => {
      const tz = p.timezone || 'America/New_York'
      try {
        const localHourStr = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: tz,
        }).format(now)
        // Midnight can return "24" in some environments
        const localHour = parseInt(localHourStr) % 24
        return localHour === targetHour
      } catch {
        return false
      }
    })
    .map(p => p.clerk_user_id)

  if (matchingUserIds.length === 0) return []

  // Cross-reference with push subscriptions
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')
    .in('clerk_user_id', matchingUserIds)

  if (!subRows || subRows.length === 0) return []

  return [...new Set(subRows.map(s => s.clerk_user_id))]
}

// Per-user preferred hour variant — reads each user's custom hour from
// notification_preferences (morning_hour / evening_hour columns).
// Falls back to defaultHour if the column is null or missing.
// Rule: ALL times are user-local, never UTC.
export async function getEligibleUsersForPreferredHour(
  prefKey: string,
  hourColumn: string,
  defaultHour: number
): Promise<string[]> {
  const supabase = getServiceClient()

  // Fetch users with this pref enabled + their preferred hour
  const { data: prefRows } = await supabase
    .from('notification_preferences')
    .select(`clerk_user_id, ${hourColumn}`)
    .eq(prefKey, true)

  if (!prefRows || prefRows.length === 0) return []

  const userIds = prefRows.map(r => r.clerk_user_id)

  // Build per-user hour map
  const hourMap: Record<string, number> = {}
  for (const row of prefRows) {
    hourMap[row.clerk_user_id] = row[hourColumn] ?? defaultHour
  }

  // Fetch timezones
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('clerk_user_id, timezone')
    .in('clerk_user_id', userIds)

  if (!profileRows || profileRows.length === 0) return []

  const now = new Date()
  const matchingUserIds = profileRows
    .filter(p => {
      const tz = p.timezone || 'America/New_York'
      const preferredHour = hourMap[p.clerk_user_id] ?? defaultHour
      try {
        const localHourStr = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: tz,
        }).format(now)
        const localHour = parseInt(localHourStr) % 24
        return localHour === preferredHour
      } catch {
        return false
      }
    })
    .map(p => p.clerk_user_id)

  if (matchingUserIds.length === 0) return []

  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')
    .in('clerk_user_id', matchingUserIds)

  if (!subRows || subRows.length === 0) return []

  return [...new Set(subRows.map(s => s.clerk_user_id))]
}
