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
  title: 'Product Kit Generator — Powered by Photoroom',
  description:
    'Paste your product URL and get a ready-to-use marketing kit: SEO description, platform copy, 5 professional product images + AI lifestyle staging — in seconds.',
  openGraph: {
    title: 'Product Kit Generator — Powered by Photoroom',
    description:
      'Get a professional marketing kit for your product in seconds. SEO copy + 5 platform-optimised images + AI lifestyle staging.',
    siteName: 'Photoroom Product Kit Generator',
    locale: 'es_ES',
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
    <html lang="es" className={cn(inter.variable)}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
