import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import NavBar from './_components/NavBar'
import DesktopSidebar from './_components/DesktopSidebar'
import SplashScreen from './_components/SplashScreen'
import PageTransition from './_components/PageTransition'
import { MoodProvider } from './_components/MoodContext'
import ActivityTracker from './_components/ActivityTracker'
import LowBatteryOverlay from './_components/LowBatteryOverlay'
import NotificationBanner from './_components/NotificationBanner'
import TimezoneSync from './_components/TimezoneSync'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Gate: redirect to onboarding if not complete
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile?.onboarding_completed_at) redirect('/onboarding')

  return (
    <MoodProvider>
      <ActivityTracker />
      <LowBatteryOverlay />
      {/* Full-viewport shell */}
      <div className="h-dvh bg-[#FBF8F5] flex flex-col overflow-hidden">
        {/* Notification banner — full viewport width, above sidebar+content */}
        <NotificationBanner />
        {/* Desktop: sidebar + content side-by-side */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar — desktop only (hidden on mobile) */}
          <DesktopSidebar />
          {/* Content column — mobile: centered max-w-md; desktop: fills remaining space */}
          <div className="lumi-content-col flex-1 min-w-0 flex flex-col overflow-hidden relative">
            <SplashScreen />
            <TimezoneSync />
            <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <PageTransition>{children}</PageTransition>
            </main>
            {/* Bottom nav — mobile only */}
            <NavBar />
          </div>
        </div>
      </div>
    </MoodProvider>
  )
}
