import * as cheerio from 'cheerio'
import type { ScrapedProduct } from '@/types'

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/scrape'

// ─── Shared browser headers ───────────────────────────────────────────────────
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ─── Firecrawl v2 response — formats: ['markdown'] ───────────────────────────

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
 * og:price:currency = "USD", og:price:amount = "135.0"  →  "$135"
 */
function buildPriceFromMeta(amount: string | undefined, currency: string | undefined): string | undefined {
  if (!amount) return undefined
  const num = parseFloat(amount)
  if (isNaN(num)) return undefined
  const symbol = currency === 'USD' ? '$'
    : currency === 'EUR' ? '€'
    : currency === 'GBP' ? '£'
    : currency ? `${currency} `
    : '$'
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2)
  return `${symbol}${formatted}`
}

// ─── Strategy 1: Firecrawl ────────────────────────────────────────────────────

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<ScrapedProduct> {
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
        formats: ['markdown'],
        headers: { 'User-Agent': BROWSER_UA },
      }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('TIMEOUT')
    }
    throw new Error('NETWORK')
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error('[FIRECRAWL ERROR]', response.status, body.slice(0, 300))
    throw new Error(`FC_HTTP_${response.status}`)
  }

  const json: FirecrawlResponse = await response.json()
  if (!json.success || !json.data) throw new Error('FC_NO_DATA')

  const { data } = json
  const meta     = data.metadata ?? {}

  const title = (meta.ogTitle || meta.title || '').trim()
  if (!title) throw new Error('FC_NO_TITLE')

  const description = (meta.ogDescription || meta.description || '').trim()
  const price = buildPriceFromMeta(meta['og:price:amount'], meta['og:price:currency'])

  const imageUrl =
    meta.ogImage?.trim() ||
    meta['og:image']?.trim() ||
    (data.markdown ? firstImageFromMarkdown(data.markdown) : null) ||
    null

  if (!imageUrl) throw new Error('FC_NO_IMAGE')

  return { title, description, price, imageUrl, sourceUrl: url }
}

// ─── Strategy 2: Direct fetch + cheerio ──────────────────────────────────────
// Fallback for when Firecrawl is unavailable or the host region is blocked.
// Works for any Shopify / WooCommerce / standard ecommerce store with OG tags.

async function scrapeWithFetch(url: string): Promise<ScrapedProduct> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent':      BROWSER_UA,
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control':   'no-cache',
      },
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('La página tardó demasiado en responder. Intentá de nuevo.')
    }
    throw new Error('No se pudo conectar a la página. Verificá la URL e intentá de nuevo.')
  }

  if (!response.ok) {
    throw new Error(`No se pudo acceder a la página (código ${response.status}). Verificá que la URL sea pública.`)
  }

  const html = await response.text()
  const $    = cheerio.load(html)

  const og    = (prop: string) => $(`meta[property="${prop}"]`).attr('content')?.trim()
  const meta  = (name: string) => $(`meta[name="${name}"]`).attr('content')?.trim()

  const title =
    og('og:title') ||
    meta('twitter:title') ||
    $('title').text().trim() ||
    ''

  if (!title) {
    throw new Error('No se encontró el título del producto en esa URL. Verificá que sea la página de un producto.')
  }

  const description =
    og('og:description') ||
    meta('description') ||
    meta('twitter:description') ||
    ''

  const imageUrl =
    og('og:image') ||
    meta('twitter:image') ||
    ''

  if (!imageUrl) {
    throw new Error('No se encontró imagen del producto en esa URL. Probá con la URL directa del producto.')
  }

  const priceAmount  = og('og:price:amount') || og('product:price:amount')
  const priceCurrency = og('og:price:currency') || og('product:price:currency')
  const price = buildPriceFromMeta(priceAmount, priceCurrency)

  return { title, description, price, imageUrl, sourceUrl: url }
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Tries Firecrawl first. If Firecrawl fails for any infrastructure reason
// (IP block, timeout, 5xx), falls back to direct fetch + cheerio.
// User-visible errors only surface if BOTH strategies fail.

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (apiKey) {
    try {
      return await scrapeWithFirecrawl(url, apiKey)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      // Only fall through for infrastructure/network errors.
      // Content errors (no title, no image) should still surface clearly.
      const isInfraError = ['TIMEOUT', 'NETWORK', 'FC_NO_DATA'].includes(msg) ||
                           msg.startsWith('FC_HTTP_5') ||   // 5xx from Firecrawl
                           msg === 'FC_HTTP_429'            // rate-limited → try direct
      if (!isInfraError) {
        // Translate internal codes to user-friendly messages
        if (msg === 'FC_NO_TITLE') throw new Error('No se encontró el título del producto en esa URL. Verificá que sea la página de un producto.')
        if (msg === 'FC_NO_IMAGE') throw new Error('No se encontró imagen del producto en esa URL. Probá con la URL directa del producto.')
        // FC_HTTP_4xx (401, 402, 403…) — these are real errors, not infra
        throw new Error('No se pudo leer esa página. Verificá que la URL sea pública e intentá de nuevo.')
      }
      console.warn('[FIRECRAWL] Infrastructure error, falling back to direct fetch:', msg)
    }
  }

  // Fallback: direct fetch + cheerio
  return scrapeWithFetch(url)
}
