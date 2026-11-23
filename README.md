# MeProductsVE Funnel — DeepSpace build exercise

Mini tienda demo de **MeProductsVE** (iPhones Grado A en Barquisimeto, Venezuela)
con **analítica del funnel en vivo** y un **asistente de IA**. Build exercise para
el rol GTM Intern (Summer 2027) de DeepSpace.

> Demo de evaluación: los productos, precios y métricas base son reales del
> negocio. Esta app **no cobra**: el pago real es por Cashea (BNPL), fuera de
> la app. Los pedidos aquí son solo borradores (apartados).

## Qué hace

- **Tienda pública** (`/store`): catálogo de 3 iPhones con detalle, oferta
  "0% de inicial · Nivel 6" y apartado con inicio de sesión (Google/GitHub).
  Cada interacción registra un evento del funnel en la base de datos en
  tiempo real.
- **Panel del funnel** (`/dashboard`, requiere sesión): datos base reales de
  MeProductsVE (1.21M impresiones, 52K clics, 4.29% CTR, 63 pedidos,
  $14,236.92 revenue) + embudo en vivo por etapa y por producto, con la mayor
  caída destacada.
- **Asistente de IA** (`/assistant`, requiere sesión): responde preguntas del
  catálogo y da UN insight del funnel (la mayor caída + un experimento a
  probar), consultando los eventos en vivo. Solo lectura: no crea ni modifica
  registros.

## Integraciones DeepSpace (3)

1. **Base de datos en tiempo real** — colecciones `funnel-events` (un registro
   por interacción) y `orders` (borradores de pedido). Los visitantes sin
   sesión pueden crear eventos del funnel (rol `viewer`); solo los miembros
   leen el panel.
2. **Auth** — Google/GitHub (overlay de DeepSpace). Navegar es público;
   apartar y ver el panel requieren sesión.
3. **IA** — `deepspace add ai-chat`: chat con historial, herramientas de
   lectura de registros y system prompt con el catálogo y las reglas del
   funnel. Cada usuario paga su propia conversación con sus créditos.

Fuera de alcance (a propósito): pagos/Stripe, integración con Cashea,
WhatsApp/DM, presencia/edición colaborativa, roles admin.

## Estructura

```
src/lib/catalog.ts        catálogo, oferta, etapas del funnel, datos base demo
src/lib/funnel.ts         conteos, conversiones, mayor caída, funnel por producto
src/schemas/funnel-events-schema.ts
src/schemas/orders-schema.ts
src/pages/index.tsx       landing estática (hero MeProductsVE)
src/pages/(app)/store.tsx tienda + flujo de apartado
src/pages/(app)/(protected)/dashboard.tsx
src/pages/(app)/(protected)/assistant.tsx
src/ai/tools.ts           system prompt MeProductsVE + herramientas solo-lectura
src/lib/logo.ts           logo real embebido como data URI (el repo no lleva
                        binarios: el conector de GitHub solo admite texto)
```

## Cómo correrlo (dueño)

```bash
npx deepspace auth login        # OAuth en el navegador (GitHub o Google)
npx deepspace auth whoami       # verificar que la sesión es la del dueño
npx deepspace app init --json   # registra la app y minta el app id
git add -A && git commit -m "MeProductsVE funnel"
npx deepspace deploy            # publica en https://meproductsve-funnel.app.space
```

> El primer `deploy` desde un checkout con remote de GitHub fija GitHub como
> fuente de la app (permanente). Crea el repo en GitHub y el remote **antes**
> del primer deploy. Nunca corras `deepspace push` antes del primer deploy
> desde GitHub.

Desarrollo local: `npx deepspace dev start` (http://localhost:5173).

## Verificado sin login (por el agente)

- `tsc --noEmit` — limpio.
- `eslint .` — limpio.
- `vite build` — pasa con un app id temporal de formato válido en una copia
  descartable de `wrangler.toml` (solo para verificar la compilación; el
  `wrangler.toml` del repo sigue en `__APP_ID__` y `dist/` se eliminó).
  El build real lo hace el dueño tras `app init`.
- Prerender de `/` verificado en el HTML estático (headline + logo).

**Sin verificar (requieren la sesión del dueño):** `deepspace dev start`,
`deepspace test run` (Playwright: smoke/api/collab), `deepspace deploy`, y el
flujo en vivo (login, eventos en tiempo real, chat con IA, deploy).

## Tradeoffs principales

- **Catálogo como constantes, no como registros.** Los 3 productos viven en
  `src/lib/catalog.ts`. Sembrarlos como registros habría exigido un flujo de
  seed con escritura anónima o una acción de servidor; el catálogo casi no
  cambia y el asistente lo conoce vía el system prompt. La DB en tiempo real
  se usa donde aporta: eventos del funnel y pedidos.
- **Conteo de eventos, no visitantes únicos.** La demo no hace sessionización;
  el panel muestra conteos de eventos y lo dice. Un producto real usaría
  sesiones y deduplicación.
- **Lectura de pedidos por cualquier miembro.** Sin flujo de aprovisionamiento
  de roles admin, el dueño ve los apartados porque `member` lee `orders`. En
  producción, la lectura sería solo-admin.
- **Asistente solo-lectura.** El chat puede consultar registros pero no crear
  pedidos ni modificar datos: los pedidos los hace el usuario en la tienda.
- **Sin Stripe.** El riel de pago real es Cashea, fuera del alcance del
  ejercicio; el apartado es una intención, no un cobro.

## Qué verificar antes de entregar (dueño)

1. Abrir la URL en vivo, navegar la tienda sin sesión y confirmar que el
   panel muestra los eventos.
2. Iniciar sesión, apartar un iPhone y confirmar el pedido en el panel.
3. Preguntar al asistente por el funnel y confirmar que el insight usa los
   eventos en vivo.
4. Pegar en el portal: URL en vivo + repo de GitHub + nota de entrega.
