import Anthropic from '@anthropic-ai/sdk'
import type { ScrapedProduct, GeneratedCopy, Platform } from '@/types'

const MODEL = 'claude-opus-4-7'

// Lazy singleton — avoids capturing an empty process.env.ANTHROPIC_API_KEY
// that can exist when the shell exports the variable as '' before Next.js
// loads .env.local (Next.js doesn't override already-set env vars).
let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// ─── Platform detection ────────────────────────────────────────────────────────
// Order matters: check definitive signals first, broad heuristics last.

export function detectPlatform(url: string): Platform {
  const lower = url.toLowerCase()

  // Amazon: matches amazon.com, amazon.co.uk, amazon.de, amazon.fr, etc.
  if (/amazon\.[a-z]/.test(lower)) return 'amazon'

  // Etsy: only etsy.com
  if (lower.includes('etsy.com')) return 'etsy'

  // Shopify: definitive (myshopify.com subdomain) or heuristic (/products/ path)
  // Caveat: /products/ also appears in WooCommerce — acceptable false-positive rate for MVP
  if (lower.includes('myshopify.com') || lower.includes('/products/')) return 'shopify'

  return 'generic'
}

// ─── Prompt templates ──────────────────────────────────────────────────────────

function buildShopifyPrompt(product: ScrapedProduct): string {
  const price = product.price ? `Price: ${product.price}` : ''
  return `You are an expert DTC (Direct-to-Consumer) copywriter specializing in Shopify product pages and Google Shopping.

PRODUCT:
Name: ${product.title}
Description: ${product.description}
${price}
URL: ${product.sourceUrl}

CHANNEL: Shopify product page + Google Shopping

TASK:
Write brand-first, story-driven copy. This is NOT a marketplace listing — it's a product page for an independent brand. The tone should feel like a modern DTC brand (think Allbirds, Glossier, Warby Parker): confident, purposeful, human. If the product has sustainable, handcrafted, or indie brand signals, lean into them.

REQUIREMENTS:
1. "description": 130–170 words. Brand narrative first, then product details. Use long-tail keywords naturally for Google Shopping (not keyword stuffing). Write in third person. No first-person ("I", "we", "our"). End with a soft call to action sentiment.
2. "bullets": 5 punchy product highlights. Each under 15 words. Start with a strong benefit word or phrase (no ALL CAPS). Format for a modern product page, not Amazon. Think: "Crafted from premium eucalyptus fiber for all-day breathability"
3. "tweet": Voice of a satisfied customer or the brand. Emotional hook. Feel authentic, not ad-like. Max 2 hashtags. Max 280 characters.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no text outside the JSON.
{"description":"...","bullets":["...","...","...","...","..."],"tweet":"..."}`
}

function buildEtsyPrompt(product: ScrapedProduct): string {
  const price = product.price ? `Price: ${product.price}` : ''
  return `You are an expert Etsy copywriter who helps artisan sellers write listings that rank and convert.

PRODUCT:
Name: ${product.title}
Description: ${product.description}
${price}
URL: ${product.sourceUrl}

CHANNEL: Etsy marketplace listing

TASK:
Write warm, artisan-first copy with the maker's voice. Etsy buyers care deeply about: who made it, how it was made, what it's made of, and who it's perfect for (gifts, occasions, personal use). Lean into the handmade, small-batch, or craft story wherever the product suggests it.

REQUIREMENTS:
1. "description": 130–170 words. Open with the emotional appeal or use case, then describe materials and craft process, then suggest gift occasions or the ideal recipient. Use natural Etsy-style long-tail keywords ("handmade X for Y", "perfect gift for Z"). Third person or neutral voice.
2. "bullets": 5 aspects buyers on Etsy search for. Cover: main material, occasion/gift use, style/aesthetic, care/durability, personalization or uniqueness. Keep each under 20 words. Warm, human tone — no corporate language.
3. "tweet": Voice of the artisan or a delighted customer. Personal, warm, community-oriented. Max 2 hashtags (e.g. #HandmadeWithLove #EtsyFinds). Max 280 characters.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no text outside the JSON.
{"description":"...","bullets":["...","...","...","...","..."],"tweet":"..."}`
}

function buildAmazonPrompt(product: ScrapedProduct): string {
  const price = product.price ? `Price: ${product.price}` : ''
  return `You are an Amazon listing optimization expert who writes copy that ranks in A9 search and converts browsers into buyers.

PRODUCT:
Name: ${product.title}
Description: ${product.description}
${price}
URL: ${product.sourceUrl}

CHANNEL: Amazon product listing

TASK:
Write precise, keyword-rich copy compliant with Amazon's Terms of Service. No superlatives ("best", "#1", "greatest") unless verifiable. No competitor mentions. No subjective claims without backing. Front-load the most important keywords in the first 200 characters of the description.

REQUIREMENTS:
1. "description": 130–170 words. Lead with the primary keyword + main benefit in the first sentence. Include secondary keywords naturally. Focus on features AND their direct benefits. Avoid fluff or filler. Third person only.
2. "bullets": 5 classic Amazon-style bullet points. Start each with an ALL CAPS keyword phrase (2–4 words), followed by a colon and the benefit explanation. Each under 20 words total. Pattern: "KEYWORD PHRASE: benefit explanation that answers a buyer question."
3. "tweet": Less critical for Amazon, but still useful for social proof. Feature-forward, clear value proposition. Max 2 hashtags. Max 280 characters.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no text outside the JSON.
{"description":"...","bullets":["...","...","...","...","..."],"tweet":"..."}`
}

function buildGenericPrompt(product: ScrapedProduct): string {
  const price = product.price ? `Price: ${product.price}` : ''
  return `You are an expert ecommerce copywriter specialized in conversion optimization and SEO for online marketplaces.

PRODUCT:
Name: ${product.title}
Description: ${product.description}
${price}
URL: ${product.sourceUrl}

TASK:
Analyze the product type and adapt your tone accordingly:
- Fashion/lifestyle → aspirational, sensory language
- Electronics/tools → precise, feature-benefit focused
- Home goods → warm, comfort-oriented
- Health/wellness → empathetic, results-focused

REQUIREMENTS:
1. "description": 130–170 words. SEO-optimized for search engines and shopping platforms. Use natural keywords relevant to the product category. Focus on benefits and emotional connection. Third person only.
2. "bullets": 5 bullet points. Each highlights a KEY BENEFIT (not just a feature). Start each with a strong capitalized keyword or action phrase. Under 20 words each.
3. "tweet": Max 280 characters. Emotional hook or curiosity gap opener. No generic phrases like "Check this out". Max 2 hashtags.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no text outside the JSON.
{"description":"...","bullets":["...","...","...","...","..."],"tweet":"..."}`
}

function buildPrompt(product: ScrapedProduct, platform: Platform): string {
  switch (platform) {
    case 'shopify': return buildShopifyPrompt(product)
    case 'etsy':    return buildEtsyPrompt(product)
    case 'amazon':  return buildAmazonPrompt(product)
    case 'generic': return buildGenericPrompt(product)
  }
}

// ─── JSON parsing helpers ──────────────────────────────────────────────────────

function extractJson(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) return trimmed
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (jsonMatch?.[0]) return jsonMatch[0]
  return trimmed
}

function parseGeneratedCopy(raw: string, platform: Platform): GeneratedCopy {
  const json = JSON.parse(extractJson(raw))

  if (
    typeof json.description !== 'string' ||
    !Array.isArray(json.bullets) ||
    json.bullets.length !== 5 ||
    json.bullets.some((b: unknown) => typeof b !== 'string') ||
    typeof json.tweet !== 'string'
  ) {
    throw new TypeError('Estructura JSON inválida o incompleta.')
  }

  if (json.tweet.length > 280) {
    json.tweet = (json.tweet as string).slice(0, 277) + '...'
  }

  return {
    description: json.description as string,
    bullets: json.bullets as [string, string, string, string, string],
    tweet: json.tweet as string,
    detectedPlatform: platform,
  }
}

// ─── API call ──────────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Respuesta inesperada del modelo.')
  return block.text
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function generateCopy(product: ScrapedProduct): Promise<GeneratedCopy> {
  const platform = detectPlatform(product.sourceUrl)
  const prompt = buildPrompt(product, platform)

  // ── First attempt ────────────────────────────────────────────────────────────
  let raw: string
  try {
    raw = await callClaude(prompt)
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('Demasiadas solicitudes al generador. Esperá unos segundos e intentá de nuevo.')
    }
    if (err instanceof Anthropic.APIError && err.status === 529) {
      throw new Error('El servicio de generación está saturado en este momento. Intentá de nuevo.')
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('Error de autenticación con el generador de copy.')
    }
    throw new Error('Error al conectar con el generador de copy.')
  }

  // ── First parse attempt ──────────────────────────────────────────────────────
  try {
    return parseGeneratedCopy(raw, platform)
  } catch {
    // ── Retry once ──────────────────────────────────────────────────────────────
    let retryRaw: string
    try {
      retryRaw = await callClaude(
        prompt +
          '\n\nREMINDER: Your previous response was not valid JSON. Respond with ONLY the JSON object — start with { and end with }. No markdown, no backticks, no other text.'
      )
    } catch {
      throw new Error('Error al conectar con el generador de copy.')
    }

    try {
      return parseGeneratedCopy(retryRaw, platform)
    } catch {
      throw new Error('El generador no devolvió el formato esperado. Intentá de nuevo.')
    }
  }
}
