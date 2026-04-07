import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Nunito_Sans, Quicksand } from 'next/font/google'
import './globals.css'

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const quicksand = Quicksand({
  variable: '--font-quicksand',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Lumi — ADHD Companion',
  description: 'The companion for your ADHD brain. Available the 167 hours a week a therapist isn\'t.',
  manifest: '/manifest.json',
  themeColor: '#1E1C2E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${nunitoSans.variable} ${quicksand.variable} h-full`}>
        <body className="min-h-full bg-[#FBF8F5]">{children}</body>
      </html>
    </ClerkProvider>
  )
}
