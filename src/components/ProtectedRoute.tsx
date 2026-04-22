import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { employeeService } from "@/services/employeeService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  requireWrite?: boolean;
}

export function ProtectedRoute({ children, requiredPermission, requireWrite = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAccess() {
    console.log("🔍 [PROTECTED ROUTE] Starting access check for:", requiredPermission);
    
    try {
      // Get current user
      console.log("🔍 [PROTECTED ROUTE] Getting current user...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("❌ [PROTECTED ROUTE] No user found - redirecting to login");
        router.push("/auth/login");
        return;
      }

      console.log("✅ [PROTECTED ROUTE] User found:", user.id);

      // Get user's business
      console.log("🔍 [PROTECTED ROUTE] Getting user's business...");
      const business = await businessService.getCurrentBusiness();
      
      if (!business) {
        console.log("❌ [PROTECTED ROUTE] No business found - redirecting to home");
        router.push("/");
        return;
      }

      console.log("✅ [PROTECTED ROUTE] Business found:", business.id, business.name);

      // Check if user is owner (owners have all permissions)
      console.log("🔍 [PROTECTED ROUTE] Checking if user is owner...");
      const isOwner = business.owner_id === user.id;
      console.log(isOwner ? "✅ [PROTECTED ROUTE] User is OWNER - full access granted" : "🔍 [PROTECTED ROUTE] User is EMPLOYEE - checking permissions...");

      if (isOwner) {
        console.log("✅ [PROTECTED ROUTE] Access granted (owner)");
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check employee permissions
      console.log("🔍 [PROTECTED ROUTE] Getting employee permissions...");
      const hasPermission = await employeeService.hasPermission(
        business.id,
        requiredPermission,
        requireWrite ? "write" : "read"
      );

      console.log(hasPermission ? "✅ [PROTECTED ROUTE] Permission granted" : "❌ [PROTECTED ROUTE] Permission denied");

      if (!hasPermission) {
        console.log("❌ [PROTECTED ROUTE] No permission - showing denied message");
        setHasAccess(false);
        setLoading(false);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          console.log("🔄 [PROTECTED ROUTE] Redirecting to dashboard...");
          router.push("/dashboard");
        }, 3000);
        return;
      }

      console.log("✅ [PROTECTED ROUTE] All checks passed - granting access");
      setHasAccess(true);
      setLoading(false);
    } catch (error) {
      console.error("💥 [PROTECTED ROUTE] Unexpected error:", error);
      setHasAccess(false);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a este módulo. Contacta al administrador del negocio.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirigiendo al dashboard en 3 segundos...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}