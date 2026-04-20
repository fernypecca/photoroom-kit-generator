// ─── TrustedBy — Social proof logo bar ───────────────────────────────────────
// Mirrors the "Trusted by leading brands worldwide" section on photoroom.com.
// Pure text/HTML logos — no SVG icon drawings, consistent visual weight.

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

        {/* Single row — shrink text slightly on mobile to avoid wrapping */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-5 sm:gap-x-12">

          {/* depop — bold, lowercase */}
          <span className="text-xl sm:text-2xl font-bold text-fg/40 leading-none select-none">
            depop
          </span>

          {/* mercari — light, lowercase */}
          <span className="text-xl sm:text-2xl font-light text-fg/40 leading-none select-none">
            mercari
          </span>

          {/* NAVER — black weight, uppercase */}
          <span className="text-xl sm:text-2xl font-black text-fg/40 leading-none tracking-wide select-none">
            NAVER
          </span>

          {/* amazon — custom: text + arrow SVG underneath */}
          <span className="flex flex-col items-center leading-none select-none">
            <span className="text-xl sm:text-2xl font-normal text-fg/40 leading-none tracking-wide">
              amazon
            </span>
            {/* The signature smile arrow */}
            <svg
              viewBox="0 0 80 10"
              className="w-16 sm:w-20 -mt-0.5"
              aria-hidden="true"
            >
              <path
                d="M4 5 Q40 14 76 5"
                stroke="currentColor"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                className="text-fg/40"
              />
              <path
                d="M71 2.5 L76 5 L72 8"
                stroke="currentColor"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-fg/40"
              />
            </svg>
          </span>

          {/* DECATHLON — extrabold, uppercase */}
          <span className="text-lg sm:text-xl font-extrabold text-fg/40 leading-none tracking-wider select-none">
            DECATHLON
          </span>

          {/* DOORDASH — bold, uppercase, tighter spacing */}
          <span className="text-lg sm:text-xl font-bold text-fg/40 leading-none tracking-widest select-none">
            DOORDASH
          </span>

          {/* POSHMARK — semibold, uppercase */}
          <span className="text-lg sm:text-xl font-semibold text-fg/40 leading-none tracking-widest select-none">
            POSHMARK
          </span>

        </div>
      </div>
    </section>
  )
}
