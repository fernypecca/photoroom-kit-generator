'use client'

// ─── Home page — state machine ─────────────────────────────────────────────────
// Owns the full AppState lifecycle.
// States: idle → scraping → generating → processing → email_gate → results
//                                                   ↘ error (any step)
// All API calls happen here; child components are purely presentational.

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

import { Header }      from '@/components/layout/Header'
import { Footer }      from '@/components/layout/Footer'
import { HeroInput }   from '@/components/kit-generator/HeroInput'
import { TrustedBy }   from '@/components/kit-generator/TrustedBy'
import { KitShowcase } from '@/components/kit-generator/KitShowcase'
import { LoadingScreen } from '@/components/kit-generator/LoadingScreen'
import { EmailGate }   from '@/components/kit-generator/EmailGate'
import { KitResults }  from '@/components/kit-generator/KitResults'
import { Button }      from '@/components/ui/button'
import { Toaster }     from '@/components/ui/sonner'

import { track, EVENTS } from '@/lib/analytics'
import { getVariant, trackEvent } from '@/lib/ab'
import type { AppState, GeneratedKit, } from '@/types'
import type { Variant } from '@/lib/ab'

// ─── ErrorScreen (inline — only used here) ────────────────────────────────────

function ErrorScreen({ error, onReset }: { error: string; onReset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" aria-hidden="true" />
      <h2 className="text-2xl font-bold text-fg mb-2">Something went wrong</h2>
      <p className="text-fg-muted mb-6 max-w-md">{error}</p>
      <Button onClick={onReset} variant="outline">
        ← Try with another URL
      </Button>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [appState, setAppState]               = useState<AppState>('idle')
  const [productUrl, setProductUrl]           = useState('')
  const [kit, setKit]                         = useState<GeneratedKit | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [variant, setVariant]                 = useState<Variant>('A')

  // ── A/B: assign variant on mount + track visit ────────────────────────────
  useEffect(() => {
    const v = getVariant()
    setVariant(v)
    trackEvent('visit', v)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main pipeline ──────────────────────────────────────────────────────────

  async function handleSubmit(url: string) {
    setProductUrl(url)
    setError(null)
    track(EVENTS.URL_PASTED, { url })
    trackEvent('generate', variant)

    // ── Step 1: Scrape ───────────────────────────────────────────────────────
    setAppState('scraping')
    const scrapeRes  = await fetch('/api/scrape', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url }),
    })
    const scrapeData = await scrapeRes.json()
    if (!scrapeData.success) {
      track(EVENTS.KIT_GENERATION_FAILED, { step: 'scrape', url })
      setError('We couldn\'t read that product. Try with another URL.')
      setAppState('error')
      return
    }

    // ── Step 2: Generate copy ────────────────────────────────────────────────
    setAppState('generating')
    const generateRes  = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ scraped: scrapeData.data }),
    })
    const generateData = await generateRes.json()
    if (!generateData.success) {
      track(EVENTS.KIT_GENERATION_FAILED, { step: 'generate', url })
      setError('Error generating the copy. Please try again.')
      setAppState('error')
      return
    }

    // ── Step 3: Process images ───────────────────────────────────────────────
    setAppState('processing')
    const imagesRes  = await fetch('/api/process-images', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageUrl: scrapeData.data.imageUrl }),
    })
    const imagesData = await imagesRes.json()
    if (!imagesData.success) {
      track(EVENTS.KIT_GENERATION_FAILED, { step: 'images', url })
      setError('Error processing the images. Please try again.')
      setAppState('error')
      return
    }

    // ── Step 4: Build kit → show email gate ──────────────────────────────────
    const generatedKit: GeneratedKit = {
      scraped: scrapeData.data,
      copy:    generateData.data,
      images:  imagesData.data,
    }
    setKit(generatedKit)
    track(EVENTS.KIT_GENERATION_COMPLETED, { platform: generateData.data.detectedPlatform, url })
    setAppState('email_gate')
  }

  // ── Email submit ───────────────────────────────────────────────────────────

  async function handleEmailSubmit(email: string) {
    setIsSubmittingEmail(true)
    try {
      await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, productUrl }),
      })
      track(EVENTS.EMAIL_CAPTURED, { platform: kit?.copy.detectedPlatform })
    } catch (e) {
      // Lead perdido — no bloqueamos al usuario. Decisión de producto: el kit
      // se muestra igual aunque falle el guardado del email.
      console.error('[EMAIL SUBMIT ERROR]', e)
    } finally {
      setIsSubmittingEmail(false)
      setAppState('results')
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function handleReset() {
    setAppState('idle')
    setKit(null)
    setProductUrl('')
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">

        {/* ── idle: landing page ───────────────────────────────────────────── */}
        {appState === 'idle' && (
          <>
            <div className="flex items-center justify-center">
              <HeroInput onSubmit={handleSubmit} variant={variant} />
            </div>
            <TrustedBy />
            <KitShowcase />
          </>
        )}

        {/* ── loading states: scraping / generating / processing ───────────── */}
        {(appState === 'scraping' || appState === 'generating' || appState === 'processing') && (
          <LoadingScreen productUrl={productUrl} currentStep={appState} />
        )}

        {/* ── email gate: kit ready, waiting for email ─────────────────────── */}
        {appState === 'email_gate' && kit && (
          <EmailGate
            kit={kit}
            onEmailSubmit={handleEmailSubmit}
            isSubmitting={isSubmittingEmail}
          />
        )}

        {/* ── results: full kit revealed ───────────────────────────────────── */}
        {appState === 'results' && kit && (
          <KitResults
            kit={kit}
            productUrl={productUrl}
            onReset={handleReset}
            onPhotoroomCta={() => trackEvent('cta_click', variant)}
          />
        )}

        {/* ── error: any pipeline step failed ─────────────────────────────── */}
        {appState === 'error' && error && (
          <ErrorScreen error={error} onReset={handleReset} />
        )}

      </main>

      <Footer />

      {/* Toaster — clipboard feedback + any error toasts from KitResults */}
      <Toaster position="bottom-center" richColors />
    </div>
  )
}
