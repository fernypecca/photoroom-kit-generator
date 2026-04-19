// Vercel function config — process-images runs 5 Photoroom calls in parallel,
// which can take 30-40s total. Extend timeout beyond the 10s default.
export const maxDuration = 60  // seconds — Vercel Hobby plan supports up to 60s
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { processImages } from '@/lib/photoroom'
import type { ApiResponse, ProcessedImage } from '@/types'

// Extension whitelist — CDN URLs without extension are also allowed (no extension = pass through)
const INVALID_EXTENSION = /\.(?!jpg|jpeg|png|webp)[a-z0-9]+$/i

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<ProcessedImage[]>>(
      { success: false, error: 'El body debe ser JSON válido.' },
      { status: 400 }
    )
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).imageUrl !== 'string'
  ) {
    return NextResponse.json<ApiResponse<ProcessedImage[]>>(
      { success: false, error: 'El campo "imageUrl" es requerido y debe ser un string.' },
      { status: 400 }
    )
  }

  const { imageUrl } = body as { imageUrl: string }
  const trimmedUrl = imageUrl.trim()

  // ── Validate URL format ───────────────────────────────────────────────────────
  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('protocol')
  } catch {
    return NextResponse.json<ApiResponse<ProcessedImage[]>>(
      {
        success: false,
        error: 'imageUrl debe ser una URL válida con protocolo https://. Ej: https://cdn.tienda.com/producto.jpg',
      },
      { status: 400 }
    )
  }

  // ── Validate it's not pointing to a non-image file ───────────────────────────
  // If the URL has a file extension, it must be an image extension.
  // CDN URLs without extension (e.g. /v1/image/abc123) are allowed through.
  const pathWithoutQuery = parsedUrl.pathname.toLowerCase()
  if (INVALID_EXTENSION.test(pathWithoutQuery)) {
    return NextResponse.json<ApiResponse<ProcessedImage[]>>(
      {
        success: false,
        error: 'La URL debe apuntar a una imagen (.jpg, .jpeg, .png, .webp).',
      },
      { status: 400 }
    )
  }

  // ── Process ───────────────────────────────────────────────────────────────────
  try {
    const images = await processImages(trimmedUrl)
    return NextResponse.json<ApiResponse<ProcessedImage[]>>({ success: true, data: images })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error inesperado al procesar las imágenes.'
    return NextResponse.json<ApiResponse<ProcessedImage[]>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
