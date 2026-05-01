import type { ProcessedImage, ImageStyle } from '@/types'

const PHOTOROOM_URL = 'https://image-api.photoroom.com/v2/edit'

// ─── Style configs ─────────────────────────────────────────────────────────────
// Doc note: do NOT combine shadow.mode with AI background.prompt —
// AI backgrounds already include natural shadows. Shadows only on solid-color BGs.
//
// Fix applied:
//   - export.format must be lowercase ('webp', not 'WebP') — Photoroom schema is strict
//   - background.model is NOT a form field; it goes as HTTP header 'pr-ai-background-model-version'

interface StyleConfig {
  style: ImageStyle
  channelLabel: string
  params: Record<string, string>
  extraHeaders?: Record<string, string>  // for params that Photoroom takes as headers, not form fields
}

const STYLE_CONFIGS: StyleConfig[] = [
  {
    style: 'amazon',
    channelLabel: 'Amazon Listing',
    params: {
      removeBackground: 'true',
      'background.color': 'FFFFFF',
      'shadow.mode': 'ai.soft',   // safe: solid BG, not AI BG
      padding: '0.15',
      outputSize: '1024x1024',
      'export.format': 'webp',    // FIX: lowercase
    },
  },
  {
    style: 'instagram',
    channelLabel: 'Instagram Post',
    params: {
      removeBackground: 'true',
      'background.prompt':
        'natural outdoor lifestyle setting, soft golden hour lighting, lush greenery, shallow depth of field',
      // background.model removed from params — goes as header below
      padding: '0.15',
      outputSize: '1024x1024',
      'export.format': 'webp',    // FIX: lowercase
      // No shadow.mode — AI BG already includes natural shadows
    },
    extraHeaders: {
      'pr-ai-background-model-version': 'studio',  // FIX: header, not form field
    },
  },
  {
    style: 'ads',
    channelLabel: 'Paid Ad',
    params: {
      removeBackground: 'true',
      'background.prompt':
        'vibrant colorful gradient backdrop, professional studio lighting, high-energy commercial product photography, bold saturated colors',
      // background.model removed from params — goes as header below
      padding: '0.15',
      outputSize: '1024x1024',
      'export.format': 'webp',    // FIX: lowercase
    },
    extraHeaders: {
      'pr-ai-background-model-version': 'studio',  // FIX: header, not form field
    },
  },
  {
    style: 'pinterest',
    channelLabel: 'Pinterest / Email',
    params: {
      removeBackground: 'true',
      'background.prompt':
        'minimalist flat lay on neutral linen surface, soft diffused natural light from above, subtle textured background, editorial style',
      // background.model removed from params — goes as header below
      padding: '0.18',
      outputSize: '1024x1024',
      'export.format': 'webp',    // FIX: lowercase
    },
    extraHeaders: {
      'pr-ai-background-model-version': 'studio',  // FIX: header, not form field
    },
  },
  {
    style: 'tiktok',
    channelLabel: 'TikTok Shop',
    params: {
      removeBackground: 'true',
      'background.color': 'F5F5F0',
      'shadow.mode': 'ai.hard',   // safe: solid BG
      padding: '0.10',
      outputSize: '576x1024',     // 9:16 vertical
      'export.format': 'webp',    // FIX: lowercase
    },
  },
]

// ─── Single style processor ────────────────────────────────────────────────────

async function processStyle(
  imageUrl: string,
  config: StyleConfig
): Promise<ProcessedImage> {
  const apiKey = process.env.PHOTOROOM_API_KEY
  if (!apiKey) throw new Error('PHOTOROOM_API_KEY no está configurada.')

  // ── Proxy-fetch the image through our server ─────────────────────────────────
  // Many product CDNs (Allbirds, Shopify, etc.) block Photoroom's server-side
  // fetch by user-agent or referrer. We download the image ourselves and upload
  // it as binary via image_file, which is more reliable than passing imageUrl.
  let imageBlob: Blob
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductKitGenerator/1.0)',
        'Accept': 'image/*,*/*',
      },
      signal: AbortSignal.timeout(30_000),
    })
    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`)
    imageBlob = await imgRes.blob()
  } catch (err) {
    throw new Error(
      `No se pudo descargar la imagen del producto (${err instanceof Error ? err.message : 'red error'}). ` +
      `Asegurate de que la URL de la imagen sea públicamente accesible.`
    )
  }

  // Build multipart form — Photoroom requires form data, not JSON.
  // Use image_file (binary) instead of imageUrl to bypass CDN restrictions.
  const form = new FormData()
  form.append('imageFile', imageBlob, 'product.webp')
  for (const [key, value] of Object.entries(config.params)) {
    form.append(key, value)
  }

  // Merge base headers + any style-specific headers (e.g. pr-ai-background-model-version)
  const requestHeaders: Record<string, string> = {
    'x-api-key': apiKey,
    ...config.extraHeaders,
  }

  // ── Diagnostic logging (keep until all 5 styles confirmed working) ────────────
  console.log('[PHOTOROOM REQUEST]', {
    style: config.style,
    endpoint: PHOTOROOM_URL,
    imageSize: imageBlob.size,
    params: config.params,
  })

  let response: Response
  try {
    response = await fetch(PHOTOROOM_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: form,
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error(`Timeout al procesar imagen con estilo "${config.style}". Intentá de nuevo.`)
    }
    throw new Error(`Error de red al procesar imagen con estilo "${config.style}".`)
  }

  if (!response.ok) {
    // ── Log full Photoroom error for diagnosis ────────────────────────────────────
    const errorBody = await response.text().catch(() => '(no body)')
    console.error('[PHOTOROOM ERROR]', {
      style: config.style,
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    })

    if (response.status === 422) {
      throw new Error(
        'La imagen no pudo procesarse. Asegurate de que sea una imagen de producto clara y accesible públicamente.'
      )
    }
    if (response.status === 429) {
      throw new Error('Límite de procesamiento de imágenes alcanzado. Intentá en unos minutos.')
    }
    if (response.status === 402) {
      throw new Error('Límite del plan de Photoroom alcanzado.')
    }
    throw new Error(`Error al procesar imagen con estilo "${config.style}" (${response.status}).`)
  }

  // Response is raw binary image data — convert to base64 data URL for inline use
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  return {
    style: config.style,
    channelLabel: config.channelLabel,
    imageUrl: `data:image/webp;base64,${base64}`,
    originalUrl: imageUrl,
  }
}

// ─── Main export: 5 parallel calls ────────────────────────────────────────────

export async function processImages(imageUrl: string): Promise<ProcessedImage[]> {
  const results = await Promise.allSettled(
    STYLE_CONFIGS.map((config) => processStyle(imageUrl, config))
  )

  const successful: ProcessedImage[] = []
  const failed: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : 'Error desconocido'
      failed.push(msg)
      console.error('[PHOTOROOM ERROR]', msg)
    }
  }

  if (successful.length === 0) {
    throw new Error(
      `No se pudo procesar ninguna imagen. ${failed[0] ?? 'Verificá que la URL de imagen sea pública.'}`
    )
  }

  if (failed.length > 0) {
    console.warn(`[PHOTOROOM] ${failed.length}/5 estilos fallaron. Continuando con ${successful.length}.`)
  }

  return successful
}
