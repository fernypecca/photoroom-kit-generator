import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Header ────────────────────────────────────────────────────────────────────
// 64 px tall, sticky, with a bottom border.
// Left: Photoroom logo PNG | "Product Kit Generator" (muted, medium)
// Right: "Ir a Photoroom →" CTA with UTM tracking

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 bg-background/95 backdrop-blur border-b border-border-subtle">
      <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">

        {/* ── Brand identity ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          {/* Official Photoroom logo — 876×160px source, rendered at 120×22 */}
          <Image
            src="/photoroom-logo.png"
            alt="Photoroom"
            width={120}
            height={22}
            priority
            className="h-[22px] w-auto"
          />

          {/* Vertical divider */}
          <span className="h-4 w-px bg-border-subtle" aria-hidden="true" />

          {/* Product name — signals this is a Photoroom extension */}
          <span className="font-medium text-base text-fg-muted leading-none select-none">
            Product Kit Generator
          </span>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <Link
          href="https://www.photoroom.com/?utm_source=kit_generator&utm_medium=header_cta&utm_campaign=growth_experiment"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'border-brand text-brand hover:bg-brand-soft'
          )}
        >
          Ir a Photoroom →
        </Link>

      </div>
    </header>
  )
}
