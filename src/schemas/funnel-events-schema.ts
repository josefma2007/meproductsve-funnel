/**
 * funnel-events — un registro por interacción con la tienda.
 *
 * Cada evento es una fila: qué etapa del funnel se alcanzó y, cuando aplica,
 * sobre qué producto. Los visitantes sin sesión (rol `viewer`, id `anon-*`)
 * pueden crear eventos — así la tienda pública mide el funnel sin obligar a
 * registrarse. Nadie sin sesión puede leerlos: solo los miembros ven el
 * panel, y los eventos no se pueden editar ni borrar desde el cliente.
 */

import type { CollectionSchema } from 'deepspace/schema'

export const funnelEventsSchema: CollectionSchema = {
  name: 'funnel-events',
  columns: [
    {
      name: 'stage',
      storage: 'text',
      interpretation: {
        kind: 'select',
        options: ['ad_view', 'product_view', 'offer_view', 'checkout_started', 'order_placed'],
      },
    },
    { name: 'productId', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    '*': { read: false, create: true, update: false, delete: false },
    viewer: { read: false, create: true, update: false, delete: false },
    member: { read: true, create: true, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
