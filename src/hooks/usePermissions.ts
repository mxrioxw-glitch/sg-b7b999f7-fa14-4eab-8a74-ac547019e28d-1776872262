import { useState, useEffect } from "react";
import { hasPermission, getCurrentUserPermissions, type EmployeePermission } from "@/services/employeeService";

export function usePermissions(businessId: string | null) {
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    loadPermissions();
  }, [businessId]);

  async function loadPermissions() {
    if (!businessId) return;
    
    try {
      const perms = await getCurrentUserPermissions(businessId);
      setPermissions(perms);
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkPermission(module: string, type: "read" | "write" = "read"): Promise<boolean> {
    if (!businessId) return false;
    return hasPermission(businessId, module, type);
  }

  function hasModuleAccess(module: string, type: "read" | "write" = "read"): boolean {
    const permission = permissions.find((p) => p.module === module);
    if (!permission) return false;
    return type === "read" ? permission.can_read : permission.can_write;
  }

  return {
    permissions,
    loading,
    checkPermission,
    hasModuleAccess,
    reload: loadPermissions,
  };
}