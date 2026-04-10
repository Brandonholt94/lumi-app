import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getTodayString() {
  // YYYY-MM-DD in UTC — consistent across server renders
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ messages: [] }, { status: 401 })

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('daily_chats')
    .select('messages')
    .eq('clerk_user_id', userId)
    .eq('date', getTodayString())
    .single()

  return NextResponse.json({ messages: data?.messages ?? [] })
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json()
  const supabase = getServiceClient()

  await supabase.from('daily_chats').upsert(
    {
      clerk_user_id: userId,
      date: getTodayString(),
      messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clerk_user_id,date' }
  )

  return NextResponse.json({ ok: true })
}
