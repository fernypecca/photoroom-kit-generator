'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// ─── PostHog initialisation ────────────────────────────────────────────────────
// Called once on the client when the app mounts.
// Guards against: missing env var, double-init (Next.js hot-reload), SSR.

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || key === 'phc_REPLACE_WITH_YOUR_KEY') return // skip if not configured

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
    })
  }, [])

  return null
}

// ─── App providers wrapper ─────────────────────────────────────────────────────
// Add future providers here (e.g. React Query, theme) — keeps layout.tsx clean.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogInit />
      {children}
    </PHProvider>
  )
}
