import { GetServerSidePropsContext } from "next";

/**
 * IMPORTANTE: Este middleware ya no se usa porque causa problemas de compatibilidad
 * en el entorno del servidor. En su lugar, la verificación de autenticación y permisos
 * se hace en el componente ProtectedRoute del lado del cliente.
 * 
 * Para re-habilitar la verificación de suscripción en el servidor, se necesitaría
 * implementar un cliente de Supabase específico para server-side rendering.
 */

export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  // Disabled - verification now happens client-side in ProtectedRoute
  return {
    props: {},
  };
}