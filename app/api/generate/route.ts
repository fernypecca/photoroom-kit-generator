// Vercel function config — Claude can take 15-20s for copy generation.
export const maxDuration = 30  // seconds
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateCopy } from '@/lib/claude'
import type { ApiResponse, GeneratedCopy, ScrapedProduct } from '@/types'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: 'El body debe ser JSON válido.' },
      { status: 400 }
    )
  }

  // Validate top-level shape
  if (typeof body !== 'object' || body === null || !('scraped' in body)) {
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: 'El campo "scraped" es requerido.' },
      { status: 400 }
    )
  }

  const { scraped } = body as { scraped: unknown }

  // Validate scraped fields
  if (
    typeof scraped !== 'object' ||
    scraped === null ||
    typeof (scraped as Record<string, unknown>).title !== 'string' ||
    typeof (scraped as Record<string, unknown>).description !== 'string'
  ) {
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: 'scraped.title y scraped.description son requeridos y deben ser strings.' },
      { status: 400 }
    )
  }

  const product = scraped as ScrapedProduct

  if (!product.title.trim()) {
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: 'scraped.title no puede estar vacío.' },
      { status: 400 }
    )
  }

  if (!product.description.trim()) {
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: 'scraped.description no puede estar vacío.' },
      { status: 400 }
    )
  }

  try {
    const copy = await generateCopy(product)
    return NextResponse.json<ApiResponse<GeneratedCopy>>({ success: true, data: copy })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error inesperado al generar el copy.'
    return NextResponse.json<ApiResponse<GeneratedCopy>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
