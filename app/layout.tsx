import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'

// ─── Inter font ────────────────────────────────────────────────────────────────
// Weights: 400 (body), 500 (medium), 600 (semibold), 700 (bold)
// Variable exposed as --font-sans so shadcn/tailwind can reference it.

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// ─── SEO metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Product Kit Generator — Turn any URL into 5 channel-ready images | Powered by Photoroom',
  description:
    'Paste your product URL and get a complete marketing kit: SEO description, 5 images optimized for Amazon, Instagram, TikTok and more. In 30 seconds.',
  openGraph: {
    title: 'Product Kit Generator — Turn any URL into 5 channel-ready images | Powered by Photoroom',
    description:
      'Paste your product URL and get a complete marketing kit: SEO description, 5 images optimized for Amazon, Instagram, TikTok and more. In 30 seconds.',
    siteName: 'Photoroom Product Kit Generator',
    locale: 'en_US',
    type: 'website',
  },
}

// ─── Root layout ───────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(inter.variable)}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
