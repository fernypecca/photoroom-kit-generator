import { NextRequest, NextResponse } from 'next/server'
import { scrapeProduct } from '@/lib/firecrawl'
import type { ApiResponse, ScrapedProduct } from '@/types'

export async function POST(request: NextRequest) {
  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<ScrapedProduct>>(
      { success: false, error: 'El body debe ser JSON válido.' },
      { status: 400 }
    )
  }

  // Validate that `url` field exists and is a string
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).url !== 'string'
  ) {
    return NextResponse.json<ApiResponse<ScrapedProduct>>(
      { success: false, error: 'El campo "url" es requerido y debe ser un string.' },
      { status: 400 }
    )
  }

  const rawUrl = ((body as Record<string, unknown>).url as string).trim()

  if (!rawUrl) {
    return NextResponse.json<ApiResponse<ScrapedProduct>>(
      { success: false, error: 'La URL no puede estar vacía.' },
      { status: 400 }
    )
  }

  // Validate URL format using the URL constructor (throws on invalid URLs)
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('protocol')
    }
  } catch {
    return NextResponse.json<ApiResponse<ScrapedProduct>>(
      {
        success: false,
        error:
          'La URL no tiene un formato válido. Debe empezar con https:// — ejemplo: https://tienda.com/producto',
      },
      { status: 400 }
    )
  }

  // Scrape
  try {
    const product = await scrapeProduct(rawUrl)
    return NextResponse.json<ApiResponse<ScrapedProduct>>({ success: true, data: product })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error inesperado al procesar la URL.'
    return NextResponse.json<ApiResponse<ScrapedProduct>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
