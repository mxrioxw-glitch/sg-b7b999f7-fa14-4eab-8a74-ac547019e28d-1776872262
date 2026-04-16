import { useState, useEffect } from "react";
import { employeeService, type EmployeePermission } from "@/services/employeeService";

export function usePermissions(businessId: string | null) {
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [loading, setLoading] = useState(true);

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
      const userPerms = await employeeService.getCurrentUserPermissions(businessId);
      setPermissions(userPerms);
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  }

  // Verificar si tiene un permiso específico
  const checkPermission = async (module: string, type: "read" | "write" = "read"): Promise<boolean> => {
    if (!businessId) return false;
    return employeeService.hasPermission(businessId, module, type);
  };

  // Verificar si tiene acceso a un módulo (síncrono, basado en el estado local)
  const hasModuleAccess = (module: string, type: "read" | "write" = "read"): boolean => {
    const perm = permissions.find((p) => p.module === module);
    if (!perm) return false;
    return type === "read" ? perm.can_read : perm.can_write;
  };

  return {
    permissions,
    loading,
    checkPermission,
    hasModuleAccess,
    reload: loadPermissions,
  };
}