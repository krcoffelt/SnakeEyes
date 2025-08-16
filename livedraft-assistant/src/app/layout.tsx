import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Draft Value Assistant - Positional Value Engine',
  description: 'A production-ready web app that auto-loads Underdog ADP and Sleeper ranks, tracks live snake drafts, and recommends picks using a Positional Value Index (PVE).',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>
        {children}
      </body>
    </html>
  )
} 