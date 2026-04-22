import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { timezone } = await req.json()
  if (!timezone || typeof timezone !== 'string') {
    return NextResponse.json({ error: 'Missing timezone' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from('profiles')
    .update({ timezone })
    .eq('clerk_user_id', userId)

  return NextResponse.json({ ok: true })
}
