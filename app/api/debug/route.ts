// ─── TEMPORARY DIAGNOSTIC ENDPOINT — DELETE AFTER USE ─────────────────────────
// Confirms env vars are visible in the Vercel runtime AND does a live scrape test.
// Visit /api/debug and paste the JSON response to diagnose issues.
// NEVER commit this to a long-running branch.

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  // ── Live scrape test ────────────────────────────────────────────────────────
  let scrape_test: unknown = null
  try {
    const { scrapeProduct } = await import('@/lib/firecrawl')
    scrape_test = await scrapeProduct('https://www.amazon.com/dp/B0194WDVHI')
  } catch (e) {
    scrape_test = { error: String(e) }
  }

  return Response.json({
    firecrawl:        !!process.env.FIRECRAWL_API_KEY,
    anthropic:        !!process.env.ANTHROPIC_API_KEY,
    photoroom:        !!process.env.PHOTOROOM_API_KEY,
    sheety:           !!process.env.SHEETY_ENDPOINT,
    firecrawl_length: process.env.FIRECRAWL_API_KEY?.length  ?? 0,
    anthropic_length: process.env.ANTHROPIC_API_KEY?.length  ?? 0,
    photoroom_length: process.env.PHOTOROOM_API_KEY?.length  ?? 0,
    sheety_length:    process.env.SHEETY_ENDPOINT?.length    ?? 0,
    node_env:         process.env.NODE_ENV,
    region:           process.env.VERCEL_REGION ?? 'unknown',
    scrape_test,
  })
}
