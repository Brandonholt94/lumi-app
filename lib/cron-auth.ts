// Shared cron auth guard — all cron routes call this first
export function verifyCronAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// Get all users who have a given notification pref enabled
// AND have at least one push subscription
import { createClient } from '@supabase/supabase-js'

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getEligibleUsers(prefKey: string): Promise<string[]> {
  const supabase = getServiceClient()

  // Users who have this notification enabled
  const { data: prefRows } = await supabase
    .from('notification_preferences')
    .select('clerk_user_id')
    .eq(prefKey, true)

  if (!prefRows || prefRows.length === 0) return []

  const userIds = prefRows.map(r => r.clerk_user_id)

  // Cross-reference with users who have a push subscription
  const { data: subRows } = await supabase
    .from('push_subscriptions')
    .select('clerk_user_id')
    .in('clerk_user_id', userIds)

  if (!subRows || subRows.length === 0) return []

  // Deduplicate (one user may have multiple devices)
  return [...new Set(subRows.map(s => s.clerk_user_id))]
}
