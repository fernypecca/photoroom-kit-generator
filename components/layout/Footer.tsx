import Link from 'next/link'

// ─── Footer ────────────────────────────────────────────────────────────────────
// Minimal — "Powered by Photoroom · Un experimento de Growth"
// Links to Photoroom with UTM so it counts as conversion-attributed traffic.

export function Footer() {
  return (
    <footer className="mt-auto py-8 border-t border-border-subtle bg-background-soft">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-fg-muted text-sm">
        <p>
          Powered by{' '}
          <Link
            href="https://www.photoroom.com/?utm_source=kit_generator&utm_medium=footer&utm_campaign=growth_experiment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline underline-offset-2"
          >
            Photoroom
          </Link>{' '}
          · Un experimento de Growth
        </p>
        <p className="text-xs text-fg-muted/60">
          © {new Date().getFullYear()} Photoroom
        </p>
      </div>
    </footer>
  )
}
