import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import NavBar from './_components/NavBar'
import SplashScreen from './_components/SplashScreen'
import { MoodProvider } from './_components/MoodContext'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <MoodProvider>
      <div className="min-h-screen bg-[#FBF8F5] flex flex-col max-w-md mx-auto relative">
        <SplashScreen />
        <main className="flex-1 pb-24 overflow-hidden">
          {children}
        </main>
        <NavBar />
      </div>
    </MoodProvider>
  )
}
