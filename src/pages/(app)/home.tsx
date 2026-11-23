/**
 * Home redirige a la tienda: el catálogo es la puerta de entrada de la app.
 */

import { Navigate } from 'react-router-dom'

export default function HomePage() {
  return <Navigate to="/store" replace />
}
