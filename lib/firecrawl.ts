import type { ScrapedProduct } from '@/types'

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/scrape'

// ─── Firecrawl v2 response — formats: ['markdown'] ───────────────────────────
// metadata contains standard OG/meta tags plus Firecrawl-normalized fields.
// Using metadata + markdown is faster and more reliable than LLM extraction
// (no extra credits consumed, no 30-60s wait for AI processing).

interface FirecrawlMetadata {
  title?: string
  ogTitle?: string
  description?: string
  ogDescription?: string
  ogImage?: string          // Firecrawl-normalized OG image URL
  'og:image'?: string       // raw OG image tag
  'og:price:amount'?: string
  'og:price:currency'?: string
  [key: string]: string | undefined
}

interface FirecrawlData {
  markdown?: string
  metadata?: FirecrawlMetadata
}

interface FirecrawlResponse {
  success: boolean
  data?: FirecrawlData
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pull the first absolute image URL from Firecrawl markdown.
 * Markdown image syntax: ![alt](url)
 */
function firstImageFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/)
  return match?.[1] ?? null
}

/**
 * Build a price string from OG price meta tags.
 * og:price:currency = "USD", og:price:amount = "135.0"
 * → "$135"
 */
function buildPrice(meta: FirecrawlMetadata): string | undefined {
  const amount   = meta['og:price:amount']
  const currency = meta['og:price:currency']
  if (!amount) return undefined

  const num = parseFloat(amount)
  if (isNaN(num)) return undefined

  const symbol = currency === 'USD' ? '$'
    : currency === 'EUR' ? '€'
    : currency === 'GBP' ? '£'
    : currency ? `${currency} `
    : '$'

  // Show as integer if no fractional part
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2)
  return `${symbol}${formatted}`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY no está configurada.')

  let response: Response
  try {
    response = await fetch(FIRECRAWL_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        // formats: ['markdown'] is fast, reliable, and always includes metadata.
        // No LLM credits consumed, no 30-60s wait.
        formats: ['markdown'],
        // Pass a real browser User-Agent so the target site doesn't block the
        // Firecrawl crawler as a bot (important for Shopify / CDN-protected stores).
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('La página tardó demasiado en responder. Intentá de nuevo.')
    }
    throw new Error('No se pudo conectar a la página. Verificá tu conexión.')
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error('[FIRECRAWL ERROR]', response.status, body.slice(0, 300))
    if (response.status === 429) {
      throw new Error('Demasiadas solicitudes. Esperá unos minutos e intentá de nuevo.')
    }
    if (response.status === 402) {
      throw new Error('Límite del plan de scraping alcanzado.')
    }
    if (response.status === 401) {
      throw new Error('Error de autenticación con el servicio de scraping.')
    }
    throw new Error(`Error al acceder a la página (código ${response.status}).`)
  }

  const json: FirecrawlResponse = await response.json()

  if (!json.success || !json.data) {
    throw new Error('No se pudo procesar la página. Verificá que la URL sea pública y accesible.')
  }

  const { data } = json
  const meta     = data.metadata ?? {}

  // ── Title ─────────────────────────────────────────────────────────────────────
  // ogTitle is usually the clean product name; title may include site name suffix
  const title = (meta.ogTitle || meta.title || '').trim()
  if (!title) throw new Error('No se encontró el título del producto en esa URL.')

  // ── Description ───────────────────────────────────────────────────────────────
  const description = (meta.ogDescription || meta.description || '').trim()

  // ── Price ─────────────────────────────────────────────────────────────────────
  const price = buildPrice(meta)

  // ── Image: ogImage > og:image > first markdown image ──────────────────────────
  const imageUrl =
    meta.ogImage?.trim() ||
    meta['og:image']?.trim() ||
    (data.markdown ? firstImageFromMarkdown(data.markdown) : null) ||
    null

  if (!imageUrl) {
    throw new Error(
      'No se encontró imagen del producto en esa URL. Probá con la URL directa del producto.'
    )
  }

  return {
    title,
    description,
    price,
    imageUrl,
    sourceUrl: url,
  }
}
