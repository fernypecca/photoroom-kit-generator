'use client'

import { useState, useRef, useId } from 'react'
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

// ─── Simple URL validator ──────────────────────────────────────────────────────
// Accepts bare domains (etsy.com/...) and full URLs (https://...).
// Prepends https:// if missing so new URL() can parse it.

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
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Stable IDs for aria-describedby
  const inputId = useId()
  const errorId = useId()
  const socialProofId = useId()

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

    // Stub: log + analytics (Step 6 will replace this with the state machine call)
    console.log('[FORM SUBMIT]', normalized)
    track(EVENTS.KIT_GENERATION_STARTED, { url: normalized })

    onSubmit?.(normalized)
  }

  // ── Example pill click ───────────────────────────────────────────────────────
  function handlePillClick(example: string) {
    setUrl(`https://${example}`)
    setError(null)
    inputRef.current?.focus()
  }

  // ────────────────────────────────────────────────────────────────────────────

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
            {/* sr-only label for accessibility */}
            <label htmlFor={inputId} className="sr-only">
              Product URL
            </label>

            <input
              ref={inputRef}
              id={inputId}
              data-hero-input=""
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError(null)
              }}
              disabled={isLoading}
              placeholder="Paste your product URL (Shopify, Amazon, Etsy...)"
              aria-describedby={`${error ? errorId : ''} ${socialProofId}`.trim()}
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

            {/* Inline error */}
            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive text-left px-1">
                {error}
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

        {/* ── Social proof micro-row ──────────────────────────────────────────── */}
        <div
          id={socialProofId}
          className="flex items-center gap-2 text-sm text-fg-muted"
          aria-label="What's included in the kit"
        >
          <span>⚡ 30 seconds</span>
          <span className="text-border-subtle" aria-hidden="true">·</span>
          <span>🎨 5 images + lifestyle AI</span>
          <span className="text-border-subtle" aria-hidden="true">·</span>
          <span>✍️ SEO descriptions</span>
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
