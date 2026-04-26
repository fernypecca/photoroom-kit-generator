// lib/ab.ts
// A/B test: Variant A (utility) vs Variant B (pain)

export type Variant = 'A' | 'B'

export function getVariant(): Variant {
  if (typeof window === 'undefined') return 'A'

  const existing = localStorage.getItem('ab_variant')
  if (existing === 'A' || existing === 'B') return existing

  const assigned: Variant = Math.random() < 0.5 ? 'A' : 'B'
  localStorage.setItem('ab_variant', assigned)
  return assigned
}

export function trackEvent(
  event: 'visit' | 'generate' | 'cta_click',
  variant: Variant,
  extra?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return

  const key = `ab_events`
  const existing = JSON.parse(localStorage.getItem(key) || '[]')
  existing.push({
    event,
    variant,
    timestamp: Date.now(),
    ...extra,
  })
  localStorage.setItem(key, JSON.stringify(existing))

  // también manda a PostHog si está disponible
  try {
    const ph = (window as any).posthog // eslint-disable-line @typescript-eslint/no-explicit-any
    if (ph) ph.capture(`ab_${event}`, { variant, ...extra })
  } catch {}
}

export function getStats(): {
  A: { visits: number; generates: number; cta_clicks: number }
  B: { visits: number; generates: number; cta_clicks: number }
  significance: string
} {
  if (typeof window === 'undefined') return {
    A: { visits: 0, generates: 0, cta_clicks: 0 },
    B: { visits: 0, generates: 0, cta_clicks: 0 },
    significance: 'No data',
  }

  const events = JSON.parse(localStorage.getItem('ab_events') || '[]')

  const count = (variant: Variant, event: string) =>
    events.filter((e: any) => e.variant === variant && e.event === event).length // eslint-disable-line @typescript-eslint/no-explicit-any

  const aVisits = count('A', 'visit')
  const bVisits = count('B', 'visit')
  const aGens   = count('A', 'generate')
  const bGens   = count('B', 'generate')
  const aClicks = count('A', 'cta_click')
  const bClicks = count('B', 'cta_click')

  // conversion rate simplificada
  const aRate = aVisits > 0 ? aGens / aVisits : 0
  const bRate = bVisits > 0 ? bGens / bVisits : 0

  let significance = 'Need more data (min 50 visits per variant)'
  if (aVisits >= 50 && bVisits >= 50) {
    const diff = Math.abs(aRate - bRate)
    if (diff > 0.1) significance = `Variant ${bRate > aRate ? 'B' : 'A'} winning — ${(diff * 100).toFixed(1)}pp difference`
    else significance = 'No significant difference yet'
  }

  return {
    A: { visits: aVisits, generates: aGens,  cta_clicks: aClicks },
    B: { visits: bVisits, generates: bGens,  cta_clicks: bClicks },
    significance,
  }
}
