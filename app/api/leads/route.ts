import { NextRequest, NextResponse } from 'next/server'
import { saveLead } from '@/lib/sheety'
import type { ApiResponse, Lead } from '@/types'

// Simple email regex: requires something@something.something
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'El body debe ser JSON válido.' },
      { status: 400 }
    )
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'Body inválido.' },
      { status: 400 }
    )
  }

  const { email, productUrl } = body as Record<string, unknown>

  // ── Validate email ────────────────────────────────────────────────────────────
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'El campo "email" es requerido.' },
      { status: 400 }
    )
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'El email no tiene un formato válido.' },
      { status: 400 }
    )
  }

  // ── Validate productUrl ───────────────────────────────────────────────────────
  if (typeof productUrl !== 'string' || !productUrl.trim()) {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'El campo "productUrl" es requerido.' },
      { status: 400 }
    )
  }

  try {
    const parsed = new URL(productUrl.trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    return NextResponse.json<ApiResponse<Lead>>(
      { success: false, error: 'productUrl debe ser una URL válida.' },
      { status: 400 }
    )
  }

  // ── Build lead object ─────────────────────────────────────────────────────────
  const lead: Lead = {
    email: email.trim().toLowerCase(),
    productUrl: productUrl.trim(),
    createdAt: new Date().toISOString(),
  }

  // ── Save to Sheety ────────────────────────────────────────────────────────────
  // DESIGN DECISION: if Sheety fails for any reason (timeout, 5xx, network error),
  // we log the error but still return success to the client.
  // Rationale: a lost lead is always better than blocking the user from seeing their
  // kit — the primary value exchange is the kit, not the data capture.
  // In production this could be improved with a retry queue or fallback storage.
  try {
    await saveLead(lead)
    console.log('[LEAD CAPTURED]', lead.email)
  } catch (err) {
    console.error('[SHEETY ERROR]', err instanceof Error ? err.message : err)
    // intentionally falling through — user gets their kit regardless
  }

  return NextResponse.json<ApiResponse<Lead>>({ success: true, data: lead })
}
