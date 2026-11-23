/**
 * Tienda — catálogo público de MeProductsVE (demo).
 *
 * Cualquiera puede navegar sin iniciar sesión. Cada interacción registra un
 * evento del funnel en la base de datos en tiempo real, así el panel muestra
 * el embudo en vivo: vista del anuncio → producto → oferta → pedido iniciado
 * → pedido apartado. Apartar un iPhone requiere iniciar sesión (Google o
 * GitHub) y crea un borrador de pedido — sin cobro real: el pago real es por
 * Cashea, fuera de esta app.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthOverlay, useAuth, useMutations, useQuery } from 'deepspace'
import { OFFER, PRODUCTS, getProduct, type FunnelStage, type Product } from '../../lib/catalog'
import { LOGO_DATA_URI } from '../../lib/logo'
import { cn } from '../../lib/utils'

type FunnelEventData = { stage: FunnelStage; productId: string }
type OrderData = {
  productId: string
  productName: string
  priceLabel: string
  userId: string
  status: 'draft' | 'confirmed' | 'cancelled'
}

export default function StorePage() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { create: recordEvent, ready: eventsReady } = useMutations<FunnelEventData>('funnel-events')
  const { createConfirmed: createOrder, ready: ordersReady } =
    useMutations<OrderData>('orders')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [offerRevealedId, setOfferRevealedId] = useState<string | null>(null)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [chosenPrice, setChosenPrice] = useState<string>('')
  const [showAuth, setShowAuth] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const { records: myOrders } = useQuery<OrderData>('orders', {
    where: { userId: userId ?? '__none__' },
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 10,
  })

  // Llegada a la tienda desde el anuncio: una vista del anuncio por visita.
  const adViewRecorded = useRef(false)
  useEffect(() => {
    if (adViewRecorded.current || !eventsReady) return
    adViewRecorded.current = true
    void recordEvent({ stage: 'ad_view', productId: '' })
  }, [eventsReady, recordEvent])

  const selected = selectedId ? getProduct(selectedId) : undefined
  const checkoutProduct = checkoutId ? getProduct(checkoutId) : undefined

  function openProduct(p: Product) {
    setSelectedId(p.id)
    setPlacedOrderId(null)
    setOrderError(null)
    void recordEvent({ stage: 'product_view', productId: p.id })
  }

  function revealOffer(p: Product) {
    setOfferRevealedId(p.id)
    void recordEvent({ stage: 'offer_view', productId: p.id })
  }

  function startCheckout(p: Product) {
    if (!isSignedIn || !userId) {
      setShowAuth(true)
      return
    }
    setCheckoutId(p.id)
    setChosenPrice(p.priceLines[0])
    setOrderError(null)
    void recordEvent({ stage: 'checkout_started', productId: p.id })
  }

  async function confirmOrder() {
    if (!checkoutProduct || !userId || !chosenPrice) return
    setPlacing(true)
    setOrderError(null)
    try {
      const id = await createOrder({
        productId: checkoutProduct.id,
        productName: checkoutProduct.name,
        priceLabel: chosenPrice,
        userId,
        status: 'draft',
      })
      void recordEvent({ stage: 'order_placed', productId: checkoutProduct.id })
      setPlacedOrderId(id)
      setCheckoutId(null)
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'No se pudo apartar. Inténtalo de nuevo.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero de la tienda */}
      <div className="rounded-2xl bg-navy px-6 py-8 text-white sm:px-10">
        <div className="flex flex-wrap items-center gap-6">
          <img src={LOGO_DATA_URI} alt="MeProductsVE" className="h-12 w-auto" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tu próximo iPhone, con 0% de inicial
            </h1>
            <p className="mt-1 text-sm text-white/80">
              iPhones Grado A en Barquisimeto — aparta el tuyo y págalo en cuotas con Cashea.
              Tienda demo: los precios y productos son reales de MeProductsVE.
            </p>
          </div>
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
            0% de inicial · Nivel 6
          </span>
        </div>
      </div>

      {/* Catálogo */}
      <h2 className="mt-10 text-lg font-semibold text-foreground">Catálogo</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Toca un iPhone para ver el detalle. Cada paso que das queda registrado en el funnel en vivo.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <article
            key={p.id}
            className={cn(
              'flex flex-col rounded-2xl border bg-card p-5',
              selectedId === p.id ? 'border-electric ring-2 ring-electric/40' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-electric/15 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {p.badge}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {p.grade}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Almacenamiento</dt>
                <dd className="font-medium text-foreground">{p.storage}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Batería</dt>
                <dd className="font-medium text-foreground">{p.battery}</dd>
              </div>
            </dl>
            <ul className="mt-3 space-y-1">
              {p.priceLines.map((line) => (
                <li key={line} className="text-base font-bold text-navy">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold text-brand">{OFFER.headline} · {OFFER.subline}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => openProduct(p)}
                className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Ver detalles
              </button>
              <button
                type="button"
                onClick={() => {
                  openProduct(p)
                  startCheckout(p)
                }}
                disabled={!eventsReady}
                className="flex-1 rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand/5 disabled:opacity-50"
              >
                Apartar
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Detalle del producto seleccionado */}
      {selected && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.model} · {selected.storage} · {selected.grade} · Batería {selected.battery}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>

          <p className="mt-3 text-sm text-foreground">{selected.tagline}</p>
          <ul className="mt-3 space-y-1">
            {selected.priceLines.map((line) => (
              <li key={line} className="text-lg font-bold text-navy">
                {line}
              </li>
            ))}
          </ul>

          {/* Oferta: se revela con un clic y eso registra la vista de la oferta */}
          {offerRevealedId === selected.id ? (
            <div className="mt-4 rounded-xl bg-navy p-4 text-white">
              <p className="text-lg font-bold">
                {OFFER.headline} <span className="text-electric">{OFFER.subline}</span>
              </p>
              <p className="mt-1 text-sm text-white/85">{OFFER.detail}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => revealOffer(selected)}
              className="mt-4 rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy hover:opacity-90"
            >
              Ver oferta 0% de inicial
            </button>
          )}

          {/* Pedido */}
          {placedOrderId ? (
            <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-4">
              <p className="font-semibold text-foreground">¡Apartado! 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu {selected.name} quedó apartado (pedido {placedOrderId.slice(0, 13)}…). Te
                contactamos por DM para completar el pago por Cashea. Sin cobro en esta demo.
              </p>
              <Link to="/dashboard" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                Verlo en el panel del funnel →
              </Link>
            </div>
          ) : checkoutId === selected.id && checkoutProduct ? (
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">Confirmar apartado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige cómo lo pagas. El apartado no cobra nada hoy.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {checkoutProduct.priceLines.map((line) => (
                  <label key={line} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="price"
                      checked={chosenPrice === line}
                      onChange={() => setChosenPrice(line)}
                      className="accent-[#0656C2]"
                    />
                    <span className="font-medium text-foreground">{line}</span>
                  </label>
                ))}
              </div>
              {orderError && <p className="mt-2 text-sm text-destructive">{orderError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void confirmOrder()}
                  disabled={placing || !ordersReady}
                  className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {placing ? 'Apartando…' : 'Confirmar apartado'}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutId(null)}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout(selected)}
              disabled={!eventsReady || !isLoaded}
              className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Apartar / Iniciar pedido
            </button>
          )}
          {!isSignedIn && (
            <p className="mt-3 text-xs text-muted-foreground">
              Para apartar necesitas iniciar sesión con Google o GitHub. Navegar y ver la oferta no requiere cuenta.
            </p>
          )}
        </section>
      )}

      {/* Mis apartados */}
      {isSignedIn && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Mis apartados</h2>
          {myOrders.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Todavía no has apartado ningún iPhone.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {myOrders.map((o) => (
                <li key={o.recordId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.data.productName}</p>
                    <p className="text-xs text-muted-foreground">{o.data.priceLabel}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {o.data.status === 'draft' ? 'Apartado (borrador)' : o.data.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showAuth && (
        <AuthOverlay providers={['google', 'github']} onClose={() => setShowAuth(false)} />
      )}
    </div>
  )
}
