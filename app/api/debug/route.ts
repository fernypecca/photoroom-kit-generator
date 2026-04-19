// ─── TEMPORARY DIAGNOSTIC ENDPOINT — DELETE AFTER USE ─────────────────────────
// Multi-URL parallel scrape test to isolate Firecrawl vs site-specific failures.
// NEVER commit this to a long-running branch.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/scrape'

async function rawFirecrawl(url: string) {
  const apiKey = process.env.FIRECRAWL_API_KEY
  const res = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    }),
    signal: AbortSignal.timeout(25_000),
  })
  const json = await res.json()
  return {
    http_status:  res.status,
    fc_success:   json.success ?? null,
    has_markdown: !!(json.data?.markdown),
    has_metadata: !!(json.data?.metadata),
    title:        json.data?.metadata?.ogTitle ?? json.data?.metadata?.title ?? null,
    error:        json.error ?? null,
  }
}

export async function GET() {
  const urls = [
    'https://www.allbirds.com/products/mens-tree-runners',
    'https://example.com',
    'https://httpbin.org/html',
  ]

  const results = await Promise.allSettled(urls.map(rawFirecrawl))

  const scrape_tests = Object.fromEntries(
    urls.map((url, i) => {
      const r = results[i]
      return [
        url,
        r.status === 'fulfilled' ? r.value : { error: String((r as PromiseRejectedResult).reason) },
      ]
    })
  )

  return Response.json({
    firecrawl:        !!process.env.FIRECRAWL_API_KEY,
    anthropic:        !!process.env.ANTHROPIC_API_KEY,
    photoroom:        !!process.env.PHOTOROOM_API_KEY,
    sheety:           !!process.env.SHEETY_ENDPOINT,
    firecrawl_length: process.env.FIRECRAWL_API_KEY?.length  ?? 0,
    node_env:         process.env.NODE_ENV,
    region:           process.env.VERCEL_REGION ?? 'unknown',
    scrape_tests,
  })
}
