import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeePermission = Database["public"]["Tables"]["employee_permissions"]["Row"];
type EmployeePermissionInsert = Database["public"]["Tables"]["employee_permissions"]["Insert"];

export async function getEmployees(businessId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createEmployee(employee: EmployeeInsert): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<EmployeeInsert>): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]> {
  const { data, error } = await supabase
    .from("employee_permissions")
    .select("*")
    .eq("employee_id", employeeId);

  if (error) throw error;
  return data || [];
}

export async function updateEmployeePermissions(
  employeeId: string,
  permissions: { module: string; can_read: boolean; can_write: boolean }[]
): Promise<void> {
  // Primero eliminar permisos existentes
  const { error: deleteError } = await supabase
    .from("employee_permissions")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) throw deleteError;

  // Insertar nuevos permisos
  if (permissions.length > 0) {
    const { error: insertError } = await supabase
      .from("employee_permissions")
      .insert(
        permissions.map((p) => ({
          employee_id: employeeId,
          module: p.module,
          can_read: p.can_read,
          can_write: p.can_write,
        }))
      );

    if (insertError) throw insertError;
  }
}

export async function getCurrentUserPermissions(businessId: string): Promise<EmployeePermission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Buscar el empleado del usuario actual en este negocio
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!employee) return [];

  return getEmployeePermissions(employee.id);
}

export async function hasPermission(businessId: string, module: string, type: "read" | "write" = "read"): Promise<boolean> {
  // Primero verificar si es el dueño del negocio
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Si es el dueño, tiene todos los permisos
  if (business.owner_id === user.id) return true;

  // Si no es el dueño, verificar permisos de empleado
  const permissions = await getCurrentUserPermissions(businessId);
  const permission = permissions.find((p) => p.module === module);

  if (!permission) return false;

  return type === "read" ? permission.can_read : permission.can_write;
}

export type { Employee, EmployeePermission };