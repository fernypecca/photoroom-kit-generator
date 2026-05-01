'use client'

// ─── KitResults — Step 5d ─────────────────────────────────────────────────────
// The "reveal" screen — shown after the user submits their email in EmailGate.
// Displays the full generated kit: 5 real images + SEO copy + upgrade CTA.
// Designed for maximum immediate impact and one-click asset use.

import { useState, useEffect } from 'react'
import { Link2, Download, Copy, Check, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import type { GeneratedKit, GeneratedCopy, ImageStyle, Platform } from '@/types'
import { track, EVENTS } from '@/lib/analytics'
import { PlatformMockup } from './PlatformMockup'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KitResultsProps {
  /** The full generated kit — copy + images. */
  kit: GeneratedKit
  /** The seller's original product URL — shown in the header for context. */
  productUrl: string
  /** Called when the user clicks "Generate another kit". Parent resets the flow. */
  onReset: () => void
  /** Called when the user clicks any Photoroom CTA — used for A/B tracking. */
  onPhotoroomCta?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<Platform, string> = {
  shopify: 'Shopify merchant',
  etsy:    'Etsy seller',
  amazon:  'Amazon seller',
  generic: 'Ecommerce',
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
 * - data: URLs (Photoroom base64): direct anchor click.
 * - Static/remote URLs: fetch → Blob → object URL, forces download dialog.
 */
function triggerDownload(imageUrl: string, style: string): void {
  const filename = `photoroom-kit-${style}-${Date.now()}.webp`

  if (imageUrl.startsWith('data:')) {
    const link    = document.createElement('a')
    link.href     = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

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
      const link    = document.createElement('a')
      link.href     = imageUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
}

// ─── ImageCard ────────────────────────────────────────────────────────────────
// Wraps a PlatformMockup (realistic platform UI frame) + a Download button.
// Each image is shown in the context of the channel it was optimised for.

interface MockupData {
  productTitle: string
  price?:       string
  headline?:    string   // copy.bullets[0]
  description?: string  // full SEO description (truncated inside mockup)
}

function ImageCard({
  style,
  channelLabel,
  imageUrl,
  onDownload,
  mockupData,
}: {
  style:        ImageStyle
  channelLabel: string
  imageUrl:     string
  onDownload:   () => void
  mockupData:   MockupData
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Channel label badge */}
      <span className="text-sm font-semibold text-brand bg-brand-soft border border-brand/20 px-3 py-1 rounded-full self-start leading-none">
        {channelLabel}
      </span>

      {/* Platform-specific mockup frame */}
      <PlatformMockup
        imageUrl={imageUrl}
        style={style}
        productTitle={mockupData.productTitle}
        price={mockupData.price}
        headline={mockupData.headline}
        description={mockupData.description}
      />

      {/* Download button */}
      <button
        onClick={onDownload}
        aria-label={`Download ${channelLabel} image`}
        className={[
          'self-end inline-flex items-center gap-1.5',
          'text-xs font-medium text-fg-muted hover:text-fg',
          'border border-border-subtle bg-background hover:bg-background-soft',
          'px-2.5 py-1 rounded-lg transition-colors duration-150',
        ].join(' ')}
      >
        <Download size={12} aria-hidden="true" />
        Download
      </button>
    </div>
  )
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

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
    onCopy()
    setCopied(true)
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

export function KitResults({ kit, productUrl, onReset, onPhotoroomCta }: KitResultsProps) {

  // ── Analytics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    track(EVENTS.KIT_DISPLAYED, { platform: kit.copy.detectedPlatform })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Local copy state — can be replaced by "regenerate" without re-scraping ─
  const [localCopy, setLocalCopy]           = useState<GeneratedCopy>(kit.copy)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [justRegenerated, setJustRegenerated] = useState(false)

  // ── Derived values ────────────────────────────────────────────────────────
  const platformLabel = PLATFORM_LABEL[localCopy.detectedPlatform] ?? localCopy.detectedPlatform
  const wordCount     = localCopy.description.trim().split(/\s+/).length

  // ── Inline copy state (tweet card) ────────────────────────────────────────
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
      localCopy.description,
      '\n\n🔹 5 Bullets:\n',
      localCopy.bullets.map((b) => `• ${b}`).join('\n'),
      '\n\n🐦 Tweet:\n',
      localCopy.tweet,
    ].join('')
    copyToClipboard(text, 'Copied to clipboard ✓')
    track(EVENTS.COPY_COPIED, { type: 'all' })
  }

  function handleCopyBullets(): void {
    const text = localCopy.bullets.map((b) => `• ${b}`).join('\n')
    copyToClipboard(text, 'Bullets copied to clipboard ✓')
    track(EVENTS.COPY_COPIED, { type: 'bullets' })
  }

  // ── Regenerate copy — re-calls /api/generate with the same scraped data ───
  async function handleRegenerate(): Promise<void> {
    setIsRegenerating(true)
    setJustRegenerated(false)
    try {
      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ scraped: kit.scraped }),
      })
      const data = await res.json()
      if (data.success) {
        setLocalCopy(data.data)
        setJustRegenerated(true)
        setTimeout(() => setJustRegenerated(false), 3000)
        track(EVENTS.COPY_COPIED, { type: 'regenerate' })
      } else {
        toast.error('Could not regenerate copy. Please try again.')
      }
    } catch {
      toast.error('Could not regenerate copy. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-16 sm:pb-20 flex flex-col gap-16">

      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4">

        <p className="text-base font-bold text-brand uppercase tracking-widest">
          Your kit is ready ✨
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-fg leading-[1.05]">
          Here&apos;s your marketing kit
        </h1>

        <div className="flex flex-wrap gap-2 items-center mt-1">
          <span className="text-sm font-semibold text-brand bg-brand-soft px-3 py-1 rounded-full">
            {platformLabel}
          </span>
          <span className="text-sm text-fg-muted bg-background-soft border border-border-subtle px-3 py-1 rounded-full">
            Generated in ~30s
          </span>
        </div>

        <div className="inline-flex items-center gap-2 self-start border border-border-subtle rounded-full px-3 py-1.5 bg-background-soft mt-1">
          <span className="text-xs text-fg-muted/50" aria-hidden="true">⭐⭐⭐⭐⭐</span>
          <span className="text-xs font-medium text-fg-muted">
            Trusted by Amazon, DoorDash &amp; Decathlon · 300M+ downloads
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-fg-muted mt-1">
          <Link2 size={14} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{truncateUrl(productUrl)}</span>
        </div>

        <hr className="border-border-subtle mt-1" />
      </header>

      {/* ── 2. Photoroom transformation showcase ───────────────────────────── */}
      {/*
        Shows the background removal in action: original scraped photo (left)
        vs the amazon-style image processed by Photoroom API (right).
        This is the core value proof — makes the API work impossible to miss.
      */}
      {(() => {
        const amazonImg = kit.images.find((i) => i.style === 'amazon')
        if (!amazonImg || amazonImg.originalUrl === amazonImg.imageUrl) return null

        return (
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft/60 to-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-brand/10">
              {/* Photoroom logo-ish icon */}
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-fg leading-tight">Background removed by Photoroom API</p>
                <p className="text-xs text-fg-muted">Your original photo → studio-ready product image in seconds</p>
              </div>
            </div>

            {/* Before / After split */}
            <div className="grid grid-cols-2 gap-0">
              {/* Before */}
              <div className="flex flex-col gap-2 p-4 border-r border-brand/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-fg-muted/40 shrink-0" />
                  <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Original photo</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-border-subtle aspect-square bg-background-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={amazonImg.originalUrl}
                    alt="Original product photo"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <p className="text-[11px] text-fg-muted text-center">Any background, any lighting</p>
              </div>

              {/* After */}
              <div className="flex flex-col gap-2 p-4 relative">
                {/* Arrow badge between panels */}
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-brand shadow-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">Processed by Photoroom ✨</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-brand/20 aspect-square bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={amazonImg.imageUrl}
                    alt="Photoroom processed product photo"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <p className="text-[11px] text-brand font-medium text-center">Background removed · Studio quality</p>
              </div>
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-brand/10 bg-white/50">
              {['Background removal', 'AI-matched lighting per channel', 'Custom style per platform', '5 formats in one API call'].map((tag) => (
                <span key={tag} className="text-xs font-medium text-brand bg-brand-soft border border-brand/20 px-2.5 py-1 rounded-full">
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── 3. Image grid ──────────────────────────────────────────────────── */}
      <section aria-labelledby="images-heading">
        <div className="flex items-center gap-3 mb-6">
          <h2 id="images-heading" className="text-base font-semibold text-fg">
            5 images optimized by channel
          </h2>
          <span className="text-xs font-medium text-fg-muted bg-background border border-border-subtle rounded-full px-2.5 py-1">
            Processed with Photoroom
          </span>
        </div>

        {/* mockupData feeds product/copy context into each platform mockup */}
        {(() => {
          const mockupData: MockupData = {
            productTitle: kit.scraped.title,
            price:        kit.scraped.price,
            headline:     localCopy.bullets[0],
            description:  localCopy.description,
          }

          return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {kit.images.map((img) => {
            const card = (
              <ImageCard
                key={img.style}
                style={img.style}
                channelLabel={img.channelLabel}
                imageUrl={img.imageUrl}
                onDownload={() => {
                  triggerDownload(img.imageUrl, img.style)
                  track(EVENTS.IMAGE_DOWNLOADED, { style: img.style })
                }}
                mockupData={mockupData}
              />
            )

            if (img.style === 'tiktok') {
              return (
                <div key={img.style} className="sm:col-span-2 lg:col-span-1 flex justify-center lg:justify-start">
                  <div className="w-2/5 sm:w-1/3 lg:w-full">
                    {card}
                  </div>
                </div>
              )
            }

            return card
          })}
        </div>
          )
        })()}
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
          onClick={() => { track(EVENTS.PHOTOROOM_CTA_CLICKED, { location: 'results_upgrade' }); onPhotoroomCta?.() }}
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
                Generated in ~8s · Adapted to {localCopy.detectedPlatform} tone
              </span>
              {/* "New version" badge — appears for 3s after regeneration */}
              {justRegenerated && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  ✓ New version
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Regenerate button */}
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                aria-label="Generate a new version of the copy"
                className={[
                  'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg',
                  'border border-border-subtle bg-background hover:bg-background-soft',
                  'text-fg-muted hover:text-fg transition-colors duration-150 font-medium',
                  isRegenerating ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <RefreshCw
                  size={13}
                  aria-hidden="true"
                  className={isRegenerating ? 'animate-spin' : ''}
                />
                {isRegenerating ? 'Generating…' : 'New version'}
              </button>

              <CopyButton
                label="Copy all"
                copiedLabel="✓ Copied"
                onCopy={handleCopyAll}
              />
            </div>
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
                {localCopy.description}
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
                {localCopy.bullets.map((bullet, i) => (
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {productUrl.replace(/^https?:\/\//, '').split('.')[0]?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-fg leading-tight">Your Store</p>
                    <p className="text-xs text-fg-muted">@yourstore</p>
                  </div>
                  <div className="ml-auto">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-fg" aria-label="X (Twitter)">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </div>

                <p className="text-sm text-fg leading-relaxed mb-3">{localCopy.tweet}</p>

                <div className="flex items-center justify-between pt-3 border-t border-border-subtle flex-wrap gap-2">
                  <p className="text-xs text-fg-muted">{localCopy.tweet.length}/280 characters</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopy(localCopy.tweet, 'tweet')}
                      className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      {copied === 'tweet' ? '✓ Copied' : 'Copy tweet'}
                    </button>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(localCopy.tweet)}`}
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
            onClick={() => { track(EVENTS.PHOTOROOM_CTA_CLICKED, { location: 'results_final' }); onPhotoroomCta?.() }}
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
