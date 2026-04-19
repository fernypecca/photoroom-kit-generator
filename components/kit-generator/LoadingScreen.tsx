'use client'

import { useState, useEffect } from 'react'
import type { AppState } from '@/types'
import { track, EVENTS } from '@/lib/analytics'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LoadingScreenProps {
  /** Optional: show which product URL is being processed */
  productUrl?: string
  /** Optional: current pipeline step from the state machine (for future use) */
  currentStep?: AppState
}

// ─── Copy ──────────────────────────────────────────────────────────────────────

const MESSAGES = [
  'Reading your product...',
  'Writing a description that converts...',
  'Optimizing bullets for each channel...',
  'Creating the perfect photo for Instagram...',
  'Generating vertical image for TikTok Shop...',
  'Almost ready — polishing the final details ✨',
] as const

// Progress % to show at each message index.
// Stays under 95 — 100% only fires when the real result arrives.
const PROGRESS_AT = [5, 22, 38, 55, 74, 90] as const

// ─── Shimmer card configs (mirrors KitShowcase grid) ──────────────────────────

const SHIMMER_CARDS = [
  { key: 'amazon',    label: 'Optimized for Amazon',         aspectClass: 'aspect-square' },
  { key: 'instagram', label: 'Optimized for Instagram',      aspectClass: 'aspect-square' },
  { key: 'ads',       label: 'Optimized for Ads',            aspectClass: 'aspect-square' },
  { key: 'pinterest', label: 'Optimized for Pinterest/Email', aspectClass: 'aspect-square' },
  { key: 'tiktok',    label: 'Optimized for TikTok Shop',    aspectClass: 'aspect-[9/16]' },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trim productUrl to a readable length for the subheading. */
function truncateUrl(url: string, max = 48): string {
  try {
    const clean = url.replace(/^https?:\/\//, '')
    return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
  } catch {
    return url.slice(0, max)
  }
}

// ─── Shimmer card ─────────────────────────────────────────────────────────────

function ShimmerCard({ label, aspectClass }: { label: string; aspectClass: string }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Channel label — matches KitShowcase badge style */}
      <span className="text-xs font-medium text-brand bg-brand-soft px-2.5 py-1 rounded-full self-start leading-none">
        {label}
      </span>
      {/* Shimmer placeholder */}
      <div
        className={`overflow-hidden rounded-xl border border-border-subtle ${aspectClass}`}
        aria-busy="true"
        aria-label={`${label} — generating...`}
      >
        <div className="w-full h-full shimmer" />
      </div>
    </div>
  )
}

// ─── Animated dots indicator ──────────────────────────────────────────────────

function BouncingDots() {
  return (
    <span className="inline-flex gap-[3px] ml-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-brand animate-bounce-dot"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="h-[3px] w-full rounded-full bg-border-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-brand/60 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoadingScreen({ productUrl }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  // ── Analytics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    track(EVENTS.LOADING_STARTED, {
      url: productUrl ?? '(unknown)',
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance message every 5 seconds; stop at last message ────────────────
  useEffect(() => {
    if (messageIndex >= MESSAGES.length - 1) return
    const timer = setTimeout(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1))
    }, 5000)
    return () => clearTimeout(timer)
  }, [messageIndex])

  const currentProgress = PROGRESS_AT[messageIndex]

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div
      role="status"
      className="flex flex-col items-center py-20 sm:py-28 px-4 sm:px-6 w-full max-w-5xl mx-auto"
    >

      {/* ── Status header ─────────────────────────────────────────────────── */}
      <div className="text-center mb-12 flex flex-col items-center gap-4 w-full max-w-[640px]">

        {/* Eyebrow */}
        <p className="text-xs font-semibold text-brand uppercase tracking-widest">
          Generating your kit
        </p>

        {/* Rotating heading — key re-mounts the element, triggering fade-in-up */}
        <h1
          key={messageIndex}
          className="animate-fade-in-up text-3xl sm:text-4xl font-bold tracking-tight text-fg text-balance leading-[1.15]"
          aria-live="polite"
          aria-atomic="true"
        >
          {MESSAGES[messageIndex]}
          {/* Bouncing dots only while not on last message */}
          {messageIndex < MESSAGES.length - 1 && <BouncingDots />}
        </h1>

        {/* Product URL context */}
        {productUrl && (
          <p className="text-sm text-fg-muted">
            Processing:{' '}
            <span className="font-medium text-fg">{truncateUrl(productUrl)}</span>
          </p>
        )}

        {/* Progress bar */}
        <ProgressBar progress={currentProgress} />
      </div>

      {/* ── Shimmer image grid ────────────────────────────────────────────── */}
      {/*
        Mirrors KitShowcase grid exactly:
        - Mobile:  1 column (stacked)
        - SM:      2 columns; TikTok centred + width-limited
        - LG:      5 equal columns, items-start (TikTok taller)
      */}
      <div className="w-full mb-10">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-fg">
            5 images optimized by channel
          </h2>
          <span className="text-xs text-fg-muted bg-background border border-border-subtle rounded-full px-2.5 py-1">
            processing...
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {SHIMMER_CARDS.slice(0, 4).map((card) => (
            <ShimmerCard key={card.key} label={card.label} aspectClass={card.aspectClass} />
          ))}

          {/* TikTok — centred + width-limited on SM */}
          <div className="sm:col-span-2 lg:col-span-1 flex justify-center lg:justify-start">
            <div className="w-1/2 sm:w-1/3 lg:w-full">
              <ShimmerCard
                label={SHIMMER_CARDS[4].label}
                aspectClass={SHIMMER_CARDS[4].aspectClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Security note ─────────────────────────────────────────────────── */}
      <p className="text-xs text-fg-muted/70 text-center max-w-[480px]">
        Images may take a moment longer — Photoroom is generating each background with AI specifically for your product.
      </p>

    </div>
  )
}
