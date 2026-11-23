/**
 * MeProductsVE — catálogo y números del funnel (datos demo reales del negocio).
 *
 * Los productos, precios y métricas son reales de MeProductsVE (Barquisimeto,
 * Venezuela — venta online desde Orlando). Los iPhones son "Grado A": nunca
 * "nuevos" ni "sellados". No hay precios ni descuentos inventados.
 */

export interface Product {
  id: string
  name: string
  model: string
  storage: string
  grade: string
  battery: string
  /** Líneas de precio tal como se ofrecen por Cashea. */
  priceLines: string[]
  tagline: string
  badge?: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'iphone-13-pro-128',
    name: 'iPhone 13 Pro 128GB',
    model: 'iPhone 13 Pro',
    storage: '128GB',
    grade: 'Grado A',
    battery: '100% y estándar',
    priceLines: ['$635 en 6 cuotas', '$685 · 100% de batería'],
    tagline: 'El favorito: ProMotion, triple cámara y batería que rinde todo el día.',
    badge: 'El más vendido',
  },
  {
    id: 'iphone-14-128',
    name: 'iPhone 14 128GB',
    model: 'iPhone 14',
    storage: '128GB',
    grade: 'Grado A',
    battery: '100%',
    priceLines: ['$570 · 100% de batería'],
    tagline: 'El equilibrio perfecto: chip A15, gran cámara y el mejor precio.',
    badge: 'Mejor precio',
  },
  {
    id: 'iphone-14-pro-256',
    name: 'iPhone 14 Pro 256GB',
    model: 'iPhone 14 Pro',
    storage: '256GB',
    grade: 'Grado A',
    battery: '100% y estándar',
    priceLines: ['$790 en 6 cuotas', '$860 en 3 cuotas'],
    tagline: 'Tope de gama: Dynamic Island, cámara de 48MP y 256GB de espacio.',
    badge: 'Tope de gama',
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

/** Oferta vigente en la tienda demo. */
export const OFFER = {
  headline: '0% de inicial',
  subline: 'con Cashea · Nivel 6',
  detail:
    'Aparta tu iPhone sin inicial y págalo en cuotas con Cashea. Sin pago hoy: en esta demo el apartado es solo una intención de pedido, sin cobro real.',
}

/** Etapas del funnel, en orden. */
export type FunnelStage =
  | 'ad_view'
  | 'product_view'
  | 'offer_view'
  | 'checkout_started'
  | 'order_placed'

export const FUNNEL_STAGES: { id: FunnelStage; label: string; hint: string }[] = [
  { id: 'ad_view', label: 'Vista del anuncio', hint: 'Llegó a la tienda desde el anuncio' },
  { id: 'product_view', label: 'Vista de producto', hint: 'Abrió el detalle de un iPhone' },
  { id: 'offer_view', label: 'Vista de la oferta', hint: 'Reveló la oferta 0% de inicial' },
  { id: 'checkout_started', label: 'Pedido iniciado', hint: 'Tocó "Apartar / Iniciar pedido"' },
  { id: 'order_placed', label: 'Pedido apartado', hint: 'Confirmó el apartado' },
]

export const STAGE_LABELS: Record<FunnelStage, string> = Object.fromEntries(
  FUNNEL_STAGES.map((s) => [s.id, s.label]),
) as Record<FunnelStage, string>

/**
 * Números base del funnel de MeProductsVE — datos reales del negocio, usados
 * como semilla demo. Antes de esta app, el funnel solo se medía en tres
 * puntos (impresiones → clics → pedidos); la oferta y el inicio de pedido
 * no se medían, y eso es justo lo que la app mide ahora en vivo.
 */
export const SEEDED_FUNNEL = {
  impressions: 1_210_000,
  clicks: 52_000,
  ctr: '4.29%',
  reach: 440_000,
  orders: 63,
  revenue: 14_236.92,
  profit: 4_213.92,
  /** Etapa por etapa, con lo que se medía históricamente. */
  stages: [
    { stage: 'ad_view' as FunnelStage, value: 1_210_000, note: 'impresiones de Meta Ads' },
    { stage: 'product_view' as FunnelStage, value: 52_000, note: 'clics al catálogo' },
    { stage: 'offer_view' as FunnelStage, value: null, note: 'no se medía antes' },
    { stage: 'checkout_started' as FunnelStage, value: null, note: 'no se medía antes' },
    { stage: 'order_placed' as FunnelStage, value: 63, note: 'pedidos cerrados' },
  ],
}

export function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
