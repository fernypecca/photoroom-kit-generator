'use client'

// ─── KitResults — Step 5d ─────────────────────────────────────────────────────
// The "reveal" screen — shown after the user submits their email in EmailGate.
// Displays the full generated kit: 5 real images + SEO copy + upgrade CTA.
// Designed for maximum immediate impact and one-click asset use.

import { useState, useEffect } from 'react'
import { Link2, Download, Copy, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import type { GeneratedKit, ImageStyle, Platform } from '@/types'
import { track, EVENTS } from '@/lib/analytics'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KitResultsProps {
  /** The full generated kit — copy + images. */
  kit: GeneratedKit
  /** The seller's original product URL — shown in the header for context. */
  productUrl: string
  /** Called when the user clicks "Generar otro kit". Parent resets the flow. */
  onReset: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<Platform, string> = {
  shopify: 'Shopify merchant',
  etsy:    'Etsy seller',
  amazon:  'Amazon seller',
  generic: 'Ecommerce',
}

/** Aspect ratio class for each image style. */
const ASPECT_CLASS: Record<ImageStyle, string> = {
  amazon:    'aspect-square',
  instagram: 'aspect-square',
  ads:       'aspect-square',
  pinterest: 'aspect-square',
  tiktok:    'aspect-[9/16]',
}

const PHOTOROOM_URL =
  'https://photoroom.com?utm_source=product-kit-generator&utm_medium=results&utm_campaign=watermark-upgrade'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateUrl(url: string, max = 60): string {
  try {
    const clean = url.replace(/^https?:\/\//, '')
    return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
  } catch {
    return url.slice(0, max)
  }
}

/**
 * Triggers a browser download — cross-browser reliable.
 * - data: URLs (Photoroom base64): direct anchor click (no fetch needed).
 * - Static/remote URLs (/examples/, https://...): fetch → Blob → object URL,
 *   which forces a download dialog instead of in-tab navigation.
 */
function triggerDownload(imageUrl: string, style: string): void {
  const filename = `photoroom-kit-${style}-${Date.now()}.webp`

  if (imageUrl.startsWith('data:')) {
    // base64 data URL — anchor click works directly
    const link    = document.createElement('a')
    link.href     = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  // Static path or remote URL — fetch to blob so browser downloads instead of navigating
  fetch(imageUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const url     = URL.createObjectURL(blob)
      const link    = document.createElement('a')
      link.href     = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
    .catch(() => {
      // Fallback: plain anchor (works for same-origin paths in most browsers)
      const link    = document.createElement('a')
      link.href     = imageUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
}

// ─── ImageCard ────────────────────────────────────────────────────────────────

function ImageCard({
  style,
  channelLabel,
  imageUrl,
  onDownload,
}: {
  style: ImageStyle
  channelLabel: string
  imageUrl: string
  onDownload: () => void
}) {
  const aspectClass = ASPECT_CLASS[style]

  return (
    <div className="flex flex-col gap-2">
      {/* Channel label — Fix 3: larger, semibold, subtle brand border */}
      <span className="text-sm font-semibold text-brand bg-brand-soft border border-brand/20 px-3 py-1 rounded-full self-start leading-none">
        {channelLabel}
      </span>

      {/* Image + always-visible download button */}
      <div className={`relative overflow-hidden rounded-xl border border-border-subtle ${aspectClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={channelLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Download button — always visible (Fix 2), scales on hover */}
        <button
          onClick={onDownload}
          aria-label={`Download ${channelLabel} image`}
          className={[
            'absolute bottom-2 right-2',
            'bg-white/90 text-fg rounded-full p-2 shadow-md',
            'hover:scale-110 active:scale-95 transition-transform duration-150',
          ].join(' ')}
        >
          <Download size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
// Manages its own 2-second "✓ Copied" visual state (optimistic).
// The parent is responsible for clipboard write + toast via onCopy.

function CopyButton({
  label,
  copiedLabel = '✓ Copied',
  onCopy,
  size = 'sm',
}: {
  label: string
  copiedLabel?: string
  onCopy: () => void
  size?: 'sm' | 'xs'
}) {
  const [copied, setCopied] = useState(false)

  function handleClick() {
    onCopy()        // parent: writes to clipboard + fires toast
    setCopied(true) // optimistic visual feedback
    setTimeout(() => setCopied(false), 2000)
  }

  const sizeClasses = size === 'xs'
    ? 'text-xs px-2.5 py-1 gap-1.5'
    : 'text-sm px-3 py-1.5 gap-2'

  return (
    <button
      onClick={handleClick}
      className={[
        'inline-flex items-center rounded-lg border border-border-subtle',
        'bg-background hover:bg-background-soft text-fg-muted hover:text-fg',
        'transition-colors duration-150 font-medium whitespace-nowrap',
        sizeClasses,
      ].join(' ')}
    >
      {copied
        ? <Check size={size === 'xs' ? 12 : 14} className="text-brand" aria-hidden="true" />
        : <Copy size={size === 'xs' ? 12 : 14} aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

// ─── KitResults ───────────────────────────────────────────────────────────────

export function KitResults({ kit, productUrl, onReset }: KitResultsProps) {

  // ── Analytics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    track(EVENTS.KIT_DISPLAYED, { platform: kit.copy.detectedPlatform })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────────────────────
  const platformLabel = PLATFORM_LABEL[kit.copy.detectedPlatform] ?? kit.copy.detectedPlatform
  const wordCount     = kit.copy.description.trim().split(/\s+/).length

  // ── Inline copy state (used by tweet card buttons) ────────────────────────
  const [copied, setCopied] = useState<string | null>(null)

  // ── Clipboard helpers ─────────────────────────────────────────────────────
  function copyToClipboard(text: string, successMsg: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(successMsg))
      .catch(() => toast.error('Could not copy. Please try again.'))
  }

  function handleCopy(text: string, type: string): void {
    copyToClipboard(text, 'Copied to clipboard ✓')
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
    track(EVENTS.COPY_COPIED, { type })
  }

  function handleCopyAll(): void {
    const text = [
      '📝 SEO Description:\n',
      kit.copy.description,
      '\n\n🔹 5 Bullets:\n',
      kit.copy.bullets.map((b) => `• ${b}`).join('\n'),
      '\n\n🐦 Tweet:\n',
      kit.copy.tweet,
    ].join('')
    copyToClipboard(text, 'Copied to clipboard ✓')
    track(EVENTS.COPY_COPIED, { type: 'all' })
  }

  function handleCopyBullets(): void {
    const text = kit.copy.bullets.map((b) => `• ${b}`).join('\n')
    copyToClipboard(text, 'Bullets copied to clipboard ✓')
    track(EVENTS.COPY_COPIED, { type: 'bullets' })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-16 sm:pb-20 flex flex-col gap-16">

      {/* ── 1. Header — Fix 1: impactante, celebratorio ─────────────────────── */}
      <header className="flex flex-col gap-5">
        <p className="text-sm font-semibold text-brand uppercase tracking-widest">
          Your kit is ready ✨
        </p>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-fg leading-[1.1]">
          Here&apos;s your marketing kit
        </h1>

        {/* Platform + time badges — more prominent */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-brand bg-brand-soft px-3 py-1 rounded-full">
            {platformLabel}
          </span>
          <span className="text-sm text-fg-muted bg-background-soft border border-border-subtle px-3 py-1 rounded-full">
            Generated in ~30s
          </span>
        </div>

        {/* Social proof */}
        <p className="text-xs text-fg-muted mt-2">
          Trusted by Amazon, DoorDash and Decathlon · 300M+ downloads
        </p>

        {/* Product URL */}
        <div className="flex items-center gap-1.5 text-base text-fg-muted mt-1">
          <Link2 size={15} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{truncateUrl(productUrl)}</span>
        </div>

        {/* Separator */}
        <hr className="border-border-subtle" />
      </header>

      {/* ── 2. Image grid ──────────────────────────────────────────────────── */}
      {/*
        Grid: 3 columns × 2 rows, items-start.
        Row 1: amazon · instagram · ads   (all aspect-square)
        Row 2: pinterest · tiktok (9:16)  (5 images total — col 3 row 2 is empty)

        Uses <img> not <Image> because imageUrl may be a data:image/webp;base64
        string returned by Photoroom — next/image cannot handle data: URLs.

        Mobile:  1 col, stacked
        SM:      2 cols
        LG:      3 cols, items-start (TikTok taller, contrast is intentional)
      */}
      <section aria-labelledby="images-heading">
        <div className="flex items-center gap-3 mb-6">
          <h2 id="images-heading" className="text-base font-semibold text-fg">
            5 images optimized by channel
          </h2>
          <span className="text-xs font-medium text-fg-muted bg-background border border-border-subtle rounded-full px-2.5 py-1">
            Processed with Photoroom
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {kit.images.map((img) => (
            <ImageCard
              key={img.style}
              style={img.style}
              channelLabel={img.channelLabel}
              imageUrl={img.imageUrl}
              onDownload={() => {
                triggerDownload(img.imageUrl, img.style)
                track(EVENTS.IMAGE_DOWNLOADED, { style: img.style })
              }}
            />
          ))}
        </div>
      </section>

      {/* ── 3. Upgrade CTA ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-background-soft to-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles size={24} className="text-brand shrink-0" aria-hidden="true" />
            <h3 className="text-lg font-bold text-fg leading-snug">
              Ready to do this for your entire catalog?
            </h3>
          </div>
          <p className="text-sm text-fg-muted">
            This took 30 seconds for 1 product. Photoroom automates this for every SKU — bulk editing, API integration, direct Shopify sync.
          </p>
          <p className="text-xs text-fg-muted/70 mt-1">
            Free plan available · No credit card · Cancel anytime
          </p>
        </div>

        <a
          href={PHOTOROOM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.PHOTOROOM_CTA_CLICKED, { location: 'results_upgrade' })}
          className={[
            'shrink-0 inline-flex items-center justify-center',
            'bg-brand hover:bg-brand-hover text-white font-semibold text-sm',
            'px-5 py-2.5 rounded-lg transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          ].join(' ')}
        >
          Try Photoroom for free →
        </a>
      </div>

      {/* ── 4. Copy card ───────────────────────────────────────────────────── */}
      <section aria-labelledby="copy-heading">
        <div className="rounded-2xl border border-border-subtle bg-background overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-background-soft flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-white bg-brand px-2.5 py-1 rounded-full">
                Detected: {platformLabel}
              </span>
              <span className="text-xs text-fg-muted">
                Generated in ~8s · Adapted to {kit.copy.detectedPlatform} tone
              </span>
            </div>
            <CopyButton
              label="Copy all"
              copiedLabel="✓ Copied"
              onCopy={handleCopyAll}
            />
          </div>

          <div className="px-6 py-6 flex flex-col gap-8">

            {/* ── Description ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3
                  id="copy-heading"
                  className="text-xs font-bold tracking-widest uppercase text-fg"
                >
                  SEO Description
                </h3>
                <span className="text-xs text-fg-muted/70 bg-background-soft border border-border-subtle px-2 py-0.5 rounded-full">
                  {wordCount} words
                </span>
              </div>
              <p className="text-sm text-fg leading-relaxed">
                {kit.copy.description}
              </p>
            </div>

            {/* ── Bullets ─────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-xs font-bold tracking-widest uppercase text-fg">
                  5 Bullets
                </h3>
                <CopyButton
                  label="Copy bullets"
                  copiedLabel="✓ Copied"
                  onCopy={handleCopyBullets}
                  size="xs"
                />
              </div>
              <ol className="flex flex-col gap-2.5">
                {kit.copy.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-brand-soft text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {bullet}
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Tweet — X/Twitter card style ────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold tracking-widest uppercase text-fg">
                Tweet
              </h3>

              <div className="border border-border-subtle rounded-2xl p-4 bg-white max-w-[500px]">
                {/* Tweet header */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar — gradient circle with first letter of domain */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {productUrl.replace(/^https?:\/\//, '').split('.')[0]?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-fg leading-tight">Your Store</p>
                    <p className="text-xs text-fg-muted">@yourstore</p>
                  </div>
                  {/* X logo */}
                  <div className="ml-auto">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-fg" aria-label="X (Twitter)">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </div>

                {/* Tweet text */}
                <p className="text-sm text-fg leading-relaxed mb-3">{kit.copy.tweet}</p>

                {/* Tweet footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle flex-wrap gap-2">
                  <p className="text-xs text-fg-muted">{kit.copy.tweet.length}/280 characters</p>
                  <div className="flex items-center gap-3">
                    {/* Copy tweet button */}
                    <button
                      onClick={() => handleCopy(kit.copy.tweet, 'tweet')}
                      className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      {copied === 'tweet' ? '✓ Copied' : 'Copy tweet'}
                    </button>
                    {/* Share on X button */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(kit.copy.tweet)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track(EVENTS.PHOTOROOM_CTA_CLICKED, { location: 'tweet_share' })}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-label="Share on X">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Final CTA ───────────────────────────────────────────────────── */}
      <section className="text-center flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-fg tracking-tight">
          Did you like the result?
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <a
            href={PHOTOROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(EVENTS.PHOTOROOM_CTA_CLICKED, { location: 'results_final' })}
            className={[
              'inline-flex items-center justify-center',
              'bg-brand hover:bg-brand-hover text-white font-semibold text-sm',
              'px-5 py-2.5 rounded-lg transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            ].join(' ')}
          >
            Explore Photoroom →
          </a>

          <button
            onClick={() => {
              track(EVENTS.KIT_RESET)
              onReset()
            }}
            className={[
              'inline-flex items-center justify-center',
              'border border-border-subtle bg-background hover:bg-background-soft',
              'text-fg font-semibold text-sm',
              'px-5 py-2.5 rounded-lg transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            ].join(' ')}
          >
            ← Generate another kit
          </button>
        </div>
      </section>

    </div>
  )
}
