import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Nunito_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const aegora = localFont({
  src: [
    { path: '../public/fonts/aegora-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/aegora-medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/aegora-bold.woff2',    weight: '700', style: 'normal' },
  ],
  variable: '--font-aegora',
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
      <html lang="en" className={`${nunitoSans.variable} ${aegora.variable} h-full`}>
        <body className="min-h-full bg-[#FBF8F5]">{children}</body>
      </html>
    </ClerkProvider>
  )
}
