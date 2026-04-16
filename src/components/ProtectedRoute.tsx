import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { employeeService } from "@/services/employeeService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  requireWrite?: boolean;
}

export function ProtectedRoute({ children, requiredPermission, requireWrite = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, [requiredPermission, requireWrite]);

  async function checkPermissions() {
    try {
      setChecking(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Get user's business
      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/");
        return;
      }

      // Check if user is owner (owners have all permissions)
      if (business.owner_id === user.id) {
        setHasAccess(true);
        setChecking(false);
        return;
      }

      // Check employee permissions
      const permissionType = requireWrite ? "write" : "read";
      const allowed = await employeeService.hasPermission(
        business.id,
        requiredPermission,
        permissionType
      );

      if (!allowed) {
        // Redirect to dashboard with access denied message
        router.push("/dashboard?access_denied=true");
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error("Error checking permissions:", error);
      router.push("/dashboard?error=true");
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}