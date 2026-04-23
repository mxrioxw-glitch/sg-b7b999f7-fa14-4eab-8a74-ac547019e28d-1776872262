import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { employeeService } from "@/services/employeeService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireWrite?: boolean;
}

export function ProtectedRoute({ children, requiredPermission, requireWrite = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [router.pathname]);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_super_admin === true) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (!requiredPermission) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/");
        return;
      }

      if (business.owner_id === user.id) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const hasPermission = await employeeService.hasPermission(
        business.id,
        requiredPermission,
        requireWrite ? "write" : "read"
      );

      if (!hasPermission) {
        setHasAccess(false);
        setLoading(false);
        setTimeout(() => router.push("/dashboard"), 3000);
        return;
      }

      setHasAccess(true);
      setLoading(false);
    } catch (error) {
      setHasAccess(false);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}