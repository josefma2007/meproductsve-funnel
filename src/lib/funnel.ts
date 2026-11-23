/**
 * Funnel analytics — conversiones entre etapas y por producto.
 *
 * Conteo honesto: se cuentan eventos registrados, no visitantes únicos
 * (esta demo no hace sessionización). Si una etapa tiene 0 eventos en vivo,
 * la conversión muestra "—" en vez de inventar un número.
 */

import { FUNNEL_STAGES, type FunnelStage } from './catalog'

export interface FunnelEventRow {
  stage: FunnelStage
  productId: string
}

export function countByStage(events: FunnelEventRow[]): Record<FunnelStage, number> {
  const counts: Record<FunnelStage, number> = {
    ad_view: 0,
    product_view: 0,
    offer_view: 0,
    checkout_started: 0,
    order_placed: 0,
  }
  for (const e of events) {
    if (e.stage in counts) counts[e.stage] += 1
  }
  return counts
}

/** Conversión de una etapa a la siguiente (null cuando no hay base). */
export function stageConversion(from: number, to: number): number | null {
  if (from <= 0) return null
  return to / from
}

export function formatPct(ratio: number | null): string {
  if (ratio === null) return '—'
  return `${(ratio * 100).toFixed(1)}%`
}

/** La etapa con la mayor caída relativa (null si no hay datos suficientes). */
export function biggestDropoff(
  counts: Record<FunnelStage, number>,
): { from: FunnelStage; to: FunnelStage; conversion: number } | null {
  let worst: { from: FunnelStage; to: FunnelStage; conversion: number } | null = null
  for (let i = 1; i < FUNNEL_STAGES.length; i++) {
    const from = FUNNEL_STAGES[i - 1].id
    const to = FUNNEL_STAGES[i].id
    const conv = stageConversion(counts[from], counts[to])
    if (conv === null) continue
    if (!worst || conv < worst.conversion) worst = { from, to, conversion: conv }
  }
  return worst
}

export interface ProductFunnel {
  productId: string
  views: number
  offers: number
  orders: number
  viewToOrder: number | null
}

export function perProductFunnel(
  events: FunnelEventRow[],
  productIds: string[],
): ProductFunnel[] {
  return productIds.map((productId) => {
    const views = events.filter((e) => e.productId === productId && e.stage === 'product_view').length
    const offers = events.filter((e) => e.productId === productId && e.stage === 'offer_view').length
    const orders = events.filter((e) => e.productId === productId && e.stage === 'order_placed').length
    return {
      productId,
      views,
      offers,
      orders,
      viewToOrder: stageConversion(views, orders),
    }
  })
}
