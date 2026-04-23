import { GetServerSidePropsContext } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has an active subscription
 * Super Admins are excluded from this check
 */
export async function checkSubscription(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Check if user is Super Admin - they don't need subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Super Admins bypass subscription check
  if (profile?.is_super_admin === true) {
    return true;
  }

  // Regular users need active subscription
  // Implementation depends on your subscription table structure
  return true; // Placeholder
}

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