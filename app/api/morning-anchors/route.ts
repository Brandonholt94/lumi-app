import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — fetch anchors + today's check-in state
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [profileRes, logsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('morning_anchors')
      .eq('clerk_user_id', userId)
      .maybeSingle(),
    supabase
      .from('morning_anchor_logs')
      .select('anchor_index')
      .eq('clerk_user_id', userId)
      .eq('log_date', today),
  ])

  const anchors: string[] = profileRes.data?.morning_anchors ?? []
  const checked: number[] = (logsRes.data ?? []).map((r: { anchor_index: number }) => r.anchor_index)

  return NextResponse.json({ anchors, checked })
}

// POST — save anchors config to profile
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { anchors } = await req.json() as { anchors: string[] }
  if (!Array.isArray(anchors) || anchors.length > 3) {
    return NextResponse.json({ error: 'Invalid anchors' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ morning_anchors: anchors })
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH — toggle a single anchor check for today
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { anchorIndex, checked } = await req.json() as { anchorIndex: number; checked: boolean }
  const today = new Date().toISOString().slice(0, 10)
  const supabase = getServiceClient()

  if (checked) {
    await supabase.from('morning_anchor_logs').upsert({
      clerk_user_id: userId,
      anchor_index: anchorIndex,
      log_date: today,
    }, { onConflict: 'clerk_user_id,anchor_index,log_date' })
  } else {
    await supabase
      .from('morning_anchor_logs')
      .delete()
      .eq('clerk_user_id', userId)
      .eq('anchor_index', anchorIndex)
      .eq('log_date', today)
  }

  return NextResponse.json({ ok: true })
}
