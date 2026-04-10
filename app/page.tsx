import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import LandingPage from './_components/LandingPage'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/today')
  return <LandingPage />
}
