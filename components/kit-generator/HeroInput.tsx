'use client'

import { useState, useRef, useEffect } from 'react'
import { track, EVENTS } from '@/lib/analytics'
import type { Variant } from '@/lib/ab'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HeroInputProps {
  /** Called with the validated URL when the user submits the form. */
  onSubmit?: (url: string) => void
  /** Disables the form while the kit is being generated. */
  isLoading?: boolean
  /** A/B variant — controls which headline is shown. */
  variant?: Variant
}

// ─── Example URL pills ─────────────────────────────────────────────────────────

const EXAMPLE_URLS = [
  'allbirds.com/products/mens-tree-runners',
  'etsy.com/listing/handmade-ceramic-mug',
  'amazon.com/anker-powercore-portable-charger',
]

// ─── Kit counter ───────────────────────────────────────────────────────────────

const COUNTER_KEY  = 'photoroom_kit_count'
const BASE_COUNT   = 2341  // realistic base — increments from here

// ─── Platform detection ────────────────────────────────────────────────────────
// Maps a typed URL to a detected platform badge.
// Full class strings are required here (not template literals) so Tailwind
// doesn't purge them in the production build.

type PlatformKey = 'amazon' | 'etsy' | 'shopify' | 'ebay' | 'walmart' | 'generic'

const PLATFORM_INFO: Record<PlatformKey, { emoji: string; label: string; classes: string }> = {
  amazon:  { emoji: '📦', label: 'Amazon detected',       classes: 'text-orange-700 bg-orange-50 border-orange-200' },
  etsy:    { emoji: '🛍️', label: 'Etsy detected',         classes: 'text-orange-500 bg-orange-50 border-orange-200' },
  shopify: { emoji: '🛒', label: 'Shopify detected',       classes: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ebay:    { emoji: '🏷️', label: 'eBay detected',         classes: 'text-blue-600 bg-blue-50 border-blue-200' },
  walmart: { emoji: '🏪', label: 'Walmart detected',       classes: 'text-blue-500 bg-blue-50 border-blue-200' },
  generic: { emoji: '🌐', label: 'Online store detected',  classes: 'text-brand bg-brand-soft border-brand/20' },
}

function detectPlatform(rawUrl: string): PlatformKey | null {
  const url = rawUrl.trim().toLowerCase()
  if (!url) return null
  if (url.includes('amazon.'))                                  return 'amazon'
  if (url.includes('etsy.'))                                    return 'etsy'
  if (url.includes('myshopify.') || url.includes('/products/')) return 'shopify'
  if (url.includes('ebay.'))                                    return 'ebay'
  if (url.includes('walmart.'))                                 return 'walmart'
  // Only show "generic" if it already looks like a full valid URL
  if (isValidUrl(rawUrl))                                       return 'generic'
  return null
}

// ─── Simple URL validator ──────────────────────────────────────────────────────

function isValidUrl(value: string): boolean {
  const candidate = value.trim()
  if (!candidate) return false
  try {
    const withProtocol = /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`
    const parsed = new URL(withProtocol)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.')
  } catch {
    return false
  }
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// ─── HeroInput component ───────────────────────────────────────────────────────

export function HeroInput({ onSubmit, isLoading = false, variant = 'A' }: HeroInputProps) {
  const [url, setUrl]   = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef          = useRef<HTMLInputElement>(null)

  // ── Platform detection ────────────────────────────────────────────────────
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformKey | null>(null)
  const detectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Live kit counter ──────────────────────────────────────────────────────
  // null = not yet hydrated (avoids SSR mismatch)
  const [kitCount, setKitCount]     = useState<number | null>(null)
  const [counterFlash, setCounterFlash] = useState(false)

  useEffect(() => {
    // Hydrate from localStorage (or seed with base count)
    const stored = localStorage.getItem(COUNTER_KEY)
    const initial = stored ? parseInt(stored, 10) : BASE_COUNT
    if (!stored) localStorage.setItem(COUNTER_KEY, String(BASE_COUNT))
    setKitCount(initial)

    // Auto-increment with a random delay (8–14 s) to simulate live usage
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      setKitCount((prev) => {
        const next = (prev ?? BASE_COUNT) + 1
        localStorage.setItem(COUNTER_KEY, String(next))
        return next
      })
      setCounterFlash(true)
      setTimeout(() => setCounterFlash(false), 600)
      // Schedule next tick with a new random delay
      timer = setTimeout(tick, 8000 + Math.random() * 6000)
    }

    timer = setTimeout(tick, 8000 + Math.random() * 6000)
    return () => clearTimeout(timer)
  }, [])

  // ── Form submission ──────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Paste a product URL to continue.')
      inputRef.current?.focus()
      return
    }
    if (!isValidUrl(url)) {
      setError('That URL doesn\'t look valid. Try something like: https://store.com/product')
      inputRef.current?.focus()
      return
    }

    const normalized = normalizeUrl(url)
    setDetectedPlatform(null) // clear badge on submit

    track(EVENTS.KIT_GENERATION_STARTED, { url: normalized })
    onSubmit?.(normalized)
  }

  // ── Example pill click ───────────────────────────────────────────────────────
  function handlePillClick(example: string) {
    const full = `https://${example}`
    setUrl(full)
    setError(null)
    // Immediately detect platform for example pills
    setDetectedPlatform(detectPlatform(full))
    inputRef.current?.focus()
  }

  // ── URL onChange with debounced platform detection ───────────────────────────
  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setUrl(value)
    if (error) setError(null)

    if (detectionTimer.current) clearTimeout(detectionTimer.current)

    if (!value.trim()) {
      setDetectedPlatform(null)
      return
    }

    detectionTimer.current = setTimeout(() => {
      setDetectedPlatform(detectPlatform(value))
    }, 350)
  }

  // ────────────────────────────────────────────────────────────────────────────

  const platformInfo = detectedPlatform ? PLATFORM_INFO[detectedPlatform] : null

  return (
    <section className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
      <div className="w-full max-w-[700px] px-4 sm:px-0 flex flex-col items-center gap-6">

        {/* ── Eyebrow label ──────────────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-brand uppercase tracking-widest">
          Product Kit Generator · by Photoroom
        </p>

        {/* ── Heading ────────────────────────────────────────────────────────── */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-fg text-balance leading-[1.1]">
          {variant === 'A'
            ? 'Turn any product URL into a complete marketing kit'
            : 'See how much you\'re losing with bad product photos'}
        </h1>

        {/* ── Subheading ─────────────────────────────────────────────────────── */}
        <p className="text-lg sm:text-xl text-fg-muted max-w-[560px] text-balance">
          SEO description + 5 images optimized for Amazon, Instagram, TikTok and more.
          In 30 seconds.
        </p>

        {/* ── Input + Button form ─────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col sm:flex-row gap-3 mt-2"
          noValidate
        >
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="hero-url-input" className="sr-only">
              Product URL
            </label>

            <input
              ref={inputRef}
              id="hero-url-input"
              data-hero-input=""
              type="url"
              value={url}
              onChange={handleUrlChange}
              disabled={isLoading}
              placeholder="Paste your product URL (Shopify, Amazon, Etsy...)"
              aria-invalid={!!error}
              className={[
                'w-full h-14 px-4 rounded-lg border-2 bg-background text-fg text-base',
                'placeholder:text-fg-muted/60',
                'transition-colors duration-150 outline-none',
                'focus:border-brand focus:ring-2 focus:ring-brand/20',
                error
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  : 'border-border-subtle hover:border-brand/40',
                isLoading ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            />

            {/* Inline validation error */}
            {error && (
              <p role="alert" className="text-sm text-destructive text-left px-1">
                {error}
              </p>
            )}

            {/* ── Platform detection badge ─────────────────────────────────── */}
            {!error && platformInfo && (
              <p className="text-left">
                <span
                  className={[
                    'inline-flex items-center gap-1.5',
                    'text-xs font-medium px-2.5 py-1 rounded-full border',
                    platformInfo.classes,
                  ].join(' ')}
                >
                  {platformInfo.emoji} {platformInfo.label}
                </span>
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={[
              'h-14 px-8 rounded-lg font-semibold text-base text-white',
              'bg-brand hover:bg-brand-hover active:scale-[0.98]',
              'transition-all duration-150 outline-none whitespace-nowrap',
              'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            ].join(' ')}
          >
            {isLoading ? 'Generating…' : 'Generate my kit →'}
          </button>
        </form>

        {/* ── Social proof micro-row + live counter ──────────────────────────── */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-fg-muted flex-wrap justify-center">
            <span>⚡ 30 seconds</span>
            <span className="text-border-subtle" aria-hidden="true">·</span>
            <span>🎨 5 images + lifestyle AI</span>
            <span className="text-border-subtle" aria-hidden="true">·</span>
            <span>✍️ SEO descriptions</span>
          </div>

          {/* Live kit counter — only renders after localStorage hydration */}
          {kitCount !== null && (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              {/* Pulsing green dot = "live" */}
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span
                className={[
                  'font-semibold transition-colors duration-500',
                  counterFlash ? 'text-brand' : 'text-fg-muted',
                ].join(' ')}
              >
                {kitCount.toLocaleString()}
              </span>
              <span>kits generated</span>
            </div>
          )}
        </div>

        {/* ── Example URL pills ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-2" aria-label="Example URLs">
          <span className="text-sm text-fg-muted self-center">Try with:</span>
          {EXAMPLE_URLS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handlePillClick(example)}
              disabled={isLoading}
              className={[
                'text-xs font-medium px-3 py-1.5 rounded-full',
                'border border-border-subtle bg-background-soft text-fg-muted',
                'hover:border-brand/50 hover:text-brand hover:bg-brand-soft',
                'transition-colors duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {example}
            </button>
          ))}
        </div>

      </div>
    </section>
  )
}
