/**
 * Panel del funnel — solo para usuarios con sesión.
 *
 * Dos vistas del mismo embudo:
 *  1. Datos base (demo): números reales de MeProductsVE. Antes de esta app el
 *     funnel solo se medía en tres puntos; la oferta y el inicio de pedido
 *     no se medían.
 *  2. En vivo: eventos registrados por la tienda en esta demo (conteo de
 *     eventos, no visitantes únicos). Interactúa en la tienda y este panel
 *     se actualiza en tiempo real.
 */

import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import {
  FUNNEL_STAGES,
  PRODUCTS,
  SEEDED_FUNNEL,
  STAGE_LABELS,
  formatCount,
  formatMoney,
} from '../../../lib/catalog'
import {
  biggestDropoff,
  countByStage,
  formatPct,
  perProductFunnel,
  stageConversion,
  type FunnelEventRow,
} from '../../../lib/funnel'
import { cn } from '../../../lib/utils'

type OrderData = {
  productId: string
  productName: string
  priceLabel: string
  userId: string
  status: 'draft' | 'confirmed' | 'cancelled'
}

export default function DashboardPage() {
  const { records: eventRecords, status: eventsStatus } = useQuery<FunnelEventRow>('funnel-events', {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 500,
  })
  const { records: orderRecords, status: ordersStatus } = useQuery<OrderData>('orders', {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 50,
  })

  const events: FunnelEventRow[] = eventRecords.map((r) => r.data)
  const counts = countByStage(events)
  const dropoff = biggestDropoff(counts)
  const perProduct = perProductFunnel(
    events,
    PRODUCTS.map((p) => p.id),
  )
  const loading = eventsStatus === 'loading' || ordersStatus === 'loading'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel del funnel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        De anuncio a pedido apartado. Los datos base son reales de MeProductsVE; los eventos en
        vivo llegan desde la tienda en tiempo real.
      </p>

      {/* Datos base (demo) */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Datos base · demo real de MeProductsVE</h2>
          <span className="rounded-full bg-gold/25 px-2.5 py-0.5 text-xs font-semibold text-navy">
            Datos demo
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Impresiones" value={formatCount(SEEDED_FUNNEL.impressions)} />
          <Stat label="Clics" value={formatCount(SEEDED_FUNNEL.clicks)} />
          <Stat label="CTR" value={SEEDED_FUNNEL.ctr} />
          <Stat label="Alcance" value={formatCount(SEEDED_FUNNEL.reach)} />
          <Stat label="Pedidos" value={formatCount(SEEDED_FUNNEL.orders)} />
          <Stat label="Revenue" value={formatMoney(SEEDED_FUNNEL.revenue)} />
          <Stat label="Ganancia" value={formatMoney(SEEDED_FUNNEL.profit)} />
          <Stat label="Margen" value="29.6%" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Antes de esta app, el funnel solo se medía en impresiones → clics → pedidos. La vista de
          la oferta y el inicio de pedido no se medían: eso es lo que la app mide ahora en vivo.
        </p>
      </section>

      {/* Embudo en vivo */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Embudo en vivo · esta demo</h2>
          <span className="text-xs text-muted-foreground">
            {loading ? 'Cargando…' : `${events.length} eventos registrados`}
          </span>
        </div>
        {events.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no hay eventos en vivo. Ve a la{' '}
            <Link to="/store" className="font-medium text-brand hover:underline">
              tienda
            </Link>{' '}
            y navega: cada paso que des aparece aquí al instante.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {FUNNEL_STAGES.map((stage, i) => {
              const count = counts[stage.id]
              const prev = i === 0 ? null : counts[FUNNEL_STAGES[i - 1].id]
              const conv = prev === null ? null : stageConversion(prev, count)
              const max = Math.max(...FUNNEL_STAGES.map((s) => counts[s.id]), 1)
              return (
                <li key={stage.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {i + 1}. {stage.label}
                      <span className="ml-2 font-normal text-muted-foreground">{stage.hint}</span>
                    </span>
                    <span className="tabular-nums">
                      <strong className="text-foreground">{formatCount(count)}</strong>
                      {conv !== null && (
                        <span className="ml-2 text-muted-foreground">· {formatPct(conv)} desde el paso anterior</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', i === FUNNEL_STAGES.length - 1 ? 'bg-gold' : 'bg-brand')}
                      style={{ width: `${Math.max((count / max) * 100, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {dropoff && (
          <div className="mt-5 rounded-xl bg-navy p-4 text-white">
            <p className="text-sm font-semibold">Mayor caída: {STAGE_LABELS[dropoff.from]} → {STAGE_LABELS[dropoff.to]}</p>
            <p className="mt-1 text-sm text-white/85">
              Solo el {formatPct(dropoff.conversion)} pasa de esa etapa a la siguiente. Pregúntale al
              asistente qué experimento probar para arreglarlo.
            </p>
            <Link
              to="/assistant"
              className="mt-2 inline-block rounded-full bg-electric px-4 py-1.5 text-sm font-medium text-navy hover:opacity-90"
            >
              Pedir el insight a la IA →
            </Link>
          </div>
        )}
      </section>

      {/* Por producto */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Por producto · en vivo</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Producto</th>
                <th className="py-2 pr-4 font-medium">Vistas</th>
                <th className="py-2 pr-4 font-medium">Ofertas vistas</th>
                <th className="py-2 pr-4 font-medium">Apartados</th>
                <th className="py-2 font-medium">Vista → apartado</th>
              </tr>
            </thead>
            <tbody>
              {perProduct.map((row) => {
                const product = PRODUCTS.find((p) => p.id === row.productId)
                return (
                  <tr key={row.productId} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-foreground">{product?.name ?? row.productId}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.views}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.offers}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.orders}</td>
                    <td className="py-2 tabular-nums">{formatPct(row.viewToOrder)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pedidos recientes */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Apartados recientes</h2>
        {orderRecords.length === 0 && !loading ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nadie ha apartado todavía. Los apartados de la tienda aparecen aquí.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {orderRecords.map((o) => (
              <li key={o.recordId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{o.data.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.data.priceLabel} · {new Date(o.createdAt).toLocaleString('es-VE')}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {o.data.status === 'draft' ? 'Apartado (borrador)' : o.data.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
