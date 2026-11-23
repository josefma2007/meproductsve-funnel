/**
 * Landing page — STATIC (sin providers: no auth, no WebSocket).
 *
 * Portada de MeProductsVE: hero navy con el logo real, los 3 iPhones del
 * catálogo y el camino del funnel (anuncio → tienda → Cashea). Los botones
 * llevan a la tienda (pública) y al panel (requiere sesión).
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { PRODUCTS } from '../lib/catalog'
import { LOGO_DATA_URI } from '../lib/logo'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen bg-white text-navy">
        {/* Hero */}
        <header className="bg-navy px-6 py-14 text-white sm:px-10">
          <div className="mx-auto max-w-6xl">
            <img src={LOGO_DATA_URI} alt="MeProductsVE" className="h-14 w-auto" />
            <h1 className="mt-8 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Tu próximo iPhone, con 0% de inicial
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85">
              iPhones Grado A en Barquisimeto, Venezuela. Aparta el tuyo en esta tienda demo y
              págalo en cuotas con Cashea — sin inicial, Nivel 6.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/store"
                className="rounded-full bg-electric px-6 py-2.5 text-sm font-bold text-navy hover:opacity-90"
              >
                Ver catálogo
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Panel del funnel
              </Link>
            </div>
          </div>
        </header>

        {/* Catálogo (resumen estático) */}
        <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
          <h2 className="text-xl font-bold">El catálogo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PRODUCTS.map((p) => (
              <article key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <span className="rounded-full bg-electric/15 px-2.5 py-0.5 text-xs font-semibold text-brand">
                  {p.badge}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-3 space-y-1">
                  {p.priceLines.map((line) => (
                    <li key={line} className="text-base font-bold text-navy">
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs font-semibold text-brand">0% de inicial · Nivel 6</p>
              </article>
            ))}
          </div>

          {/* Cómo funciona el funnel */}
          <h2 className="mt-12 text-xl font-bold">Cómo funciona el funnel</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-5">
            {[
              ['1', 'Anuncio', 'El cliente ve el iPhone en Meta Ads'],
              ['2', 'Tienda', 'Entra y ve el catálogo'],
              ['3', 'Oferta', 'Revela el 0% de inicial'],
              ['4', 'Apartado', 'Inicia sesión y aparta'],
              ['5', 'Cashea', 'Completa el pago en cuotas'],
            ].map(([n, title, desc]) => (
              <li key={n} className="rounded-2xl bg-muted/60 p-4">
                <p className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {n}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center">
            <Link to="/store" className="font-medium text-brand hover:underline">
              Entrar a la tienda →
            </Link>
          </p>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Demo del build exercise de DeepSpace · MeProductsVE · Los precios y productos son
            reales del negocio. Esta demo no cobra: el pago real es por Cashea.
          </p>
        </main>
      </div>
    </>
  )
}
