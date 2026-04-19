import type { Lead } from '@/types'

// ─── Sheety client ─────────────────────────────────────────────────────────────
// Sheety exposes a Google Sheet as a REST API.
// Row format must match the sheet's column headers exactly (camelCase).

export async function saveLead(lead: Lead): Promise<void> {
  const endpoint = process.env.SHEETY_ENDPOINT
  if (!endpoint) throw new Error('SHEETY_ENDPOINT no está configurada.')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheet1: {
        email: lead.email,
        productUrl: lead.productUrl,
        createdAt: lead.createdAt,
      },
    }),
    signal: AbortSignal.timeout(5_000), // fail fast — UX cannot wait on Sheety
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)')
    throw new Error(`Sheety respondió ${response.status}: ${body}`)
  }
}
