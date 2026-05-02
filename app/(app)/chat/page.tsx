import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import ChatClient from './_components/ChatClient'

export default async function ChatPage() {
  const { userId } = await auth()

  let firstName = ''
  if (userId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (data?.display_name) firstName = data.display_name
  }

  return <ChatClient firstName={firstName} />
}
