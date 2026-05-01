'use client'

// ─── BeforeAfterSlider ────────────────────────────────────────────────────────
// Interactive drag-to-reveal comparison: "Before" = raw product photo,
// "After ✨" = Photoroom-processed version.
// Works with any CSS aspect-ratio class (aspect-square, aspect-[9/16], etc).
// Supports mouse (desktop) and touch (mobile).

import { useState, useRef, useEffect } from 'react'

interface BeforeAfterSliderProps {
  /** Raw product photo (original, before Photoroom). */
  beforeUrl: string
  /** Photoroom-processed image. */
  afterUrl: string
  /** Accessible label base — becomes "Before: {alt}" / "After: {alt}". */
  alt: string
  /** Tailwind aspect-ratio class, e.g. "aspect-square" or "aspect-[9/16]". */
  aspectClass: string
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt,
  aspectClass,
}: BeforeAfterSliderProps) {
  // Position: 0–100 %. Start at 40 so the "After" side is already more visible.
  const [position, setPosition] = useState(40)
  const containerRef            = useRef<HTMLDivElement>(null)
  const isDragging              = useRef(false)

  function clampedPctFromClientX(clientX: number): number {
    if (!containerRef.current) return position
    const rect = containerRef.current.getBoundingClientRect()
    return Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
  }

  // ── Global mouse listeners — captures movement outside the container ────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging.current) return
      setPosition(clampedPctFromClientX(e.clientX))
    }
    function onUp() { isDragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl border border-border-subtle cursor-col-resize select-none ${aspectClass}`}
      onMouseDown={(e) => {
        isDragging.current = true
        setPosition(clampedPctFromClientX(e.clientX))
      }}
      onTouchStart={(e) => {
        isDragging.current = true
        setPosition(clampedPctFromClientX(e.touches[0].clientX))
      }}
      onTouchMove={(e) => {
        if (!isDragging.current) return
        setPosition(clampedPctFromClientX(e.touches[0].clientX))
      }}
      onTouchEnd={() => { isDragging.current = false }}
    >
      {/* ── Before: full-size background layer ─────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt={`Before: ${alt}`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* ── After: clipped to [0 → position%] from the left ────────────────── */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterUrl}
          alt={`After: ${alt}`}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* ── Divider line + circular drag handle ────────────────────────────── */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg border border-border-subtle flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-fg-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 4L4 8l4 4" />
            <path d="M16 4l4 4-4 4" />
          </svg>
        </div>
      </div>

      {/* ── Corner labels ───────────────────────────────────────────────────── */}
      <div className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full pointer-events-none">
        Before
      </div>
      <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white bg-brand/80 px-2 py-0.5 rounded-full pointer-events-none">
        After ✨
      </div>
    </div>
  )
}
