// ─── TrustedBy — Social proof logo bar ───────────────────────────────────────
// Mirrors the "Trusted by leading brands worldwide" section on photoroom.com.
// All logos rendered as inline SVG — no external image dependencies.
// Monochrome dark-gray at low opacity so they read as "social proof" without
// competing visually with the hero content above.

export function TrustedBy() {
  return (
    <section
      className="py-10 sm:py-12 border-t border-border-subtle bg-background"
      aria-label="Trusted by leading brands worldwide"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <p className="text-sm text-center text-fg-muted/60 mb-8 tracking-wide">
          Trusted by leading brands worldwide
        </p>

        {/* Logo row — wraps on mobile, single row on desktop */}
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 sm:gap-x-14">

          {/* ── depop ─────────────────────────────────────────────────────── */}
          <svg viewBox="0 0 80 28" className="h-6 w-auto fill-fg/40" aria-label="depop">
            <text
              x="0" y="22"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="24"
              fontWeight="700"
            >
              depop
            </text>
          </svg>

          {/* ── mercari ───────────────────────────────────────────────────── */}
          <svg viewBox="0 0 90 28" className="h-6 w-auto fill-fg/40" aria-label="mercari">
            <text
              x="0" y="22"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="22"
              fontWeight="400"
            >
              mercari
            </text>
          </svg>

          {/* ── NAVER ─────────────────────────────────────────────────────── */}
          <svg viewBox="0 0 80 28" className="h-6 w-auto fill-fg/40" aria-label="NAVER">
            <text
              x="0" y="22"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="22"
              fontWeight="900"
              letterSpacing="1"
            >
              NAVER
            </text>
          </svg>

          {/* ── amazon ────────────────────────────────────────────────────── */}
          {/* Wordmark + signature arrow underneath */}
          <svg viewBox="0 0 100 34" className="h-7 w-auto fill-fg/40" aria-label="Amazon">
            {/* "amazon" text */}
            <text
              x="0" y="18"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="20"
              fontWeight="400"
            >
              amazon
            </text>
            {/* Arrow — starts under 'a', curves to end under 'n' */}
            <path d="M6 24 Q50 34 94 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M88 21 L94 24 L89 27" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* ── DECATHLON ─────────────────────────────────────────────────── */}
          {/* Wheel icon + wordmark */}
          <svg viewBox="0 0 148 28" className="h-6 w-auto fill-fg/40" aria-label="Decathlon">
            {/* Simplified wheel/circle icon */}
            <circle cx="12" cy="14" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="14" r="3" />
            <line x1="12" y1="4"  x2="12" y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="21" x2="12" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2"  y1="14" x2="5"  y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="19" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            {/* Wordmark */}
            <text
              x="28" y="20"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="18"
              fontWeight="800"
              letterSpacing="0.5"
            >
              DECATHLON
            </text>
          </svg>

          {/* ── DOORDASH ──────────────────────────────────────────────────── */}
          {/* D-with-arrow icon + wordmark */}
          <svg viewBox="0 0 138 28" className="h-6 w-auto fill-fg/40" aria-label="DoorDash">
            {/* Stylised "D" with arrow */}
            <path d="M2 4 L2 24 L10 24 Q20 24 20 14 Q20 4 10 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M14 14 L22 14 M19 11 L22 14 L19 17" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Wordmark */}
            <text
              x="30" y="20"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="17"
              fontWeight="700"
              letterSpacing="0.5"
            >
              DOORDASH
            </text>
          </svg>

          {/* ── POSHMARK ──────────────────────────────────────────────────── */}
          {/* Stylised "P" icon + wordmark */}
          <svg viewBox="0 0 136 28" className="h-6 w-auto fill-fg/40" aria-label="Poshmark">
            {/* Infinity-style P icon */}
            <path d="M4 24 L4 4 Q4 4 12 4 Q20 4 20 10 Q20 16 12 16 L4 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="19" cy="22" r="3.5" />
            {/* Wordmark */}
            <text
              x="30" y="20"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="17"
              fontWeight="600"
              letterSpacing="0.5"
            >
              POSHMARK
            </text>
          </svg>

        </div>
      </div>
    </section>
  )
}
