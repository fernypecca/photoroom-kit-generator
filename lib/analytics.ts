import posthog from 'posthog-js'

// ─── Analytics helper ──────────────────────────────────────────────────────────
// Thin wrapper around PostHog so the rest of the codebase never imports
// posthog-js directly. If we ever swap analytics providers, only this file changes.
//
// Usage:  track('kit_generated', { platform: 'shopify' })

type Properties = Record<string, string | number | boolean | null | undefined>

export function track(event: string, properties?: Properties): void {
  // Guard: posthog might not be initialised yet (SSR, missing key, etc.)
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.capture(event, properties)
}

// ─── Event name constants (avoids typos across components) ────────────────────

export const EVENTS = {
  // User pastes a product URL and hits submit
  URL_PASTED: 'url_pasted',

  // User pastes URL and clicks "Generate"
  KIT_GENERATION_STARTED: 'kit_generation_started',

  // All 3 API calls (scrape + generate + images) completed successfully
  KIT_GENERATION_COMPLETED: 'kit_generation_completed',

  // Any step in the pipeline failed
  KIT_GENERATION_FAILED: 'kit_generation_failed',

  // EmailGate modal shown to user (kit ready, awaiting email)
  EMAIL_GATE_SHOWN: 'email_gate_shown',

  // User submitted email in the gate modal
  EMAIL_SUBMITTED: 'email_submitted',

  // Email successfully captured and saved to leads (after /api/leads responds)
  EMAIL_CAPTURED: 'email_captured',

  // User downloaded an image
  IMAGE_DOWNLOADED: 'image_downloaded',

  // User copied copy text to clipboard
  COPY_COPIED: 'copy_copied',

  // User clicked "Ir a Photoroom" CTA
  CTA_CLICKED: 'cta_clicked',

  // ── LoadingScreen events ────────────────────────────────────────────────────

  // LoadingScreen mounted — kit generation pipeline has started
  LOADING_STARTED: 'loading_started',

  // ── KitShowcase events ──────────────────────────────────────────────────────

  // Showcase section scrolled into view (fired once per session)
  KIT_SHOWCASE_VIEWED: 'kit_showcase_viewed',

  // User clicked "Copiar todo" in the showcase copy card
  SHOWCASE_COPY_CLICKED: 'showcase_copy_clicked',

  // User clicked the bottom CTA that scrolls back up to the input
  SHOWCASE_CTA_SCROLLED_TO_INPUT: 'showcase_cta_scrolled_to_input',

  // ── KitResults events ───────────────────────────────────────────────────────

  // KitResults mounted — user sees their full kit for the first time
  KIT_DISPLAYED: 'kit_displayed',

  // User clicked any "Probar/Explorar Photoroom" CTA on the results screen
  PHOTOROOM_CTA_CLICKED: 'photoroom_cta_clicked',

  // User clicked "Generar otro kit" to reset and start over
  KIT_RESET: 'kit_reset',
} as const
