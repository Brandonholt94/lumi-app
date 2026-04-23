import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — toggle a habit log for today
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { habitId, done } = await req.json() as { habitId: string; done: boolean }
  const today = new Date().toISOString().slice(0, 10)
  const supabase = getServiceClient()

  if (done) {
    await supabase.from('habit_logs').upsert({
      clerk_user_id: userId,
      habit_id: habitId,
      log_date: today,
    }, { onConflict: 'clerk_user_id,habit_id,log_date' })
  } else {
    await supabase
      .from('habit_logs')
      .delete()
      .eq('clerk_user_id', userId)
      .eq('habit_id', habitId)
      .eq('log_date', today)
  }

  return NextResponse.json({ ok: true })
}
