/**
 * orders — apartados (intenciones de pedido) de la tienda demo.
 *
 * Un pedido es solo un borrador: el cliente aparta el iPhone y lo completa
 * por Cashea fuera de esta app. No hay cobro ni pago real aquí.
 *
 * Lectura: cualquier miembro ve todos los pedidos (así el dueño ve los
 * apartados en el panel sin un flujo de roles admin, que esta demo no tiene).
 * En producción, la lectura debería ser solo-admin. `userId` guarda quién
 * apartó, para que cada cliente vea sus propios apartados en la tienda.
 */

import type { CollectionSchema } from 'deepspace/schema'

export const ordersSchema: CollectionSchema = {
  name: 'orders',
  columns: [
    { name: 'productId', storage: 'text', interpretation: 'plain' },
    { name: 'productName', storage: 'text', interpretation: 'plain' },
    { name: 'priceLabel', storage: 'text', interpretation: 'plain' },
    { name: 'userId', storage: 'text', interpretation: 'plain' },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ['draft', 'confirmed', 'cancelled'] },
    },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
