import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Nunito_Sans, Quicksand, Fraunces } from 'next/font/google'
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

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['700', '900'],
})

export const metadata: Metadata = {
  title: 'Lumi — ADHD Companion',
  description: "The companion for your ADHD brain. Available the 167 hours a week a therapist isn't.",
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1E1C2E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${nunitoSans.variable} ${quicksand.variable} ${fraunces.variable} h-full`}>
        <body className="min-h-full bg-[#FBF8F5]">{children}</body>
      </html>
    </ClerkProvider>
  )
}
