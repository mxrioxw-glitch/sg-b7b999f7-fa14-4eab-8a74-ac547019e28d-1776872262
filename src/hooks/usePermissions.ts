import { useState, useEffect } from "react";
import { employeeService, type EmployeePermission } from "@/services/employeeService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";

export function usePermissions(businessId: string | null) {
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  async function loadPermissions() {
    if (!businessId) return;
    try {
      setLoading(true);
      
      // Check if user is owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", businessId)
        .maybeSingle();

      const userIsOwner = business?.owner_id === user.id;
      setIsOwner(userIsOwner);

      if (userIsOwner) {
        // Owners have all permissions
        setPermissions([]);
      } else {
        // Load employee permissions
        const userPerms = await employeeService.getCurrentUserPermissions(businessId);
        setPermissions(userPerms);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  }

  // Verificar si tiene un permiso específico
  const checkPermission = async (module: string, type: "read" | "write" = "read"): Promise<boolean> => {
    if (!businessId) return false;
    if (isOwner) return true; // Owners have all permissions
    return employeeService.hasPermission(businessId, module, type);
  };

  // Verificar si tiene acceso a un módulo (síncrono, basado en el estado local)
  const hasModuleAccess = (module: string, type: "read" | "write" = "read"): boolean => {
    if (isOwner) return true; // Owners have all permissions
    const perm = permissions.find((p) => p.module === module);
    if (!perm) return false;
    return type === "read" ? perm.can_read : perm.can_write;
  };

  return {
    permissions,
    loading,
    isOwner,
    checkPermission,
    hasModuleAccess,
    reload: loadPermissions,
  };
}