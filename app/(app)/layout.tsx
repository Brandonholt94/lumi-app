import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-[#FBF8F5] flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Nav — placeholder until we build the real component */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-black/5 flex items-center justify-around px-4 py-3 z-50">
        <a href="/today" className="flex flex-col items-center gap-1 text-[#2D2A3E]">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold font-[family-name:var(--font-nunito-sans)]">Today</span>
        </a>
        <a href="/chat" className="flex flex-col items-center gap-1 text-[#9895B0]">
          <span className="text-xl">💬</span>
          <span className="text-[10px] font-bold font-[family-name:var(--font-nunito-sans)]">Lumi</span>
        </a>
        <a href="/focus" className="flex flex-col items-center gap-1 text-[#9895B0]">
          <span className="text-xl">⏱</span>
          <span className="text-[10px] font-bold font-[family-name:var(--font-nunito-sans)]">Focus</span>
        </a>
        <a href="/me" className="flex flex-col items-center gap-1 text-[#9895B0]">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold font-[family-name:var(--font-nunito-sans)]">Me</span>
        </a>
      </nav>
    </div>
  )
}
