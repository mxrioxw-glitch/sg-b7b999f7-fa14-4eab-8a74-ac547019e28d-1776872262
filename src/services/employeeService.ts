import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeePermission = Database["public"]["Tables"]["employee_permissions"]["Row"];

export type EmployeeWithUser = Employee & {
  user?: {
    email?: string;
    full_name?: string;
  } | null;
};

export const employeeService = {
  async getEmployees(businessId: string): Promise<EmployeeWithUser[]> {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        user:profiles!employees_user_id_fkey(email, full_name)
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as EmployeeWithUser[]) || [];
  },

  async createEmployeeAccount(params: {
    email: string;
    password: string;
    full_name: string;
    business_id: string;
    role?: "admin" | "cashier";
  }): Promise<{ success: boolean; employee?: any; error?: string }> {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      // Call Edge Function to create employee with proper auth headers
      const { data, error } = await supabase.functions.invoke("create-employee", {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || "Failed to create employee");
      }

      return { success: true, employee: data.employee };
    } catch (error: any) {
      console.error("Error creating employee account:", error);
      return { 
        success: false, 
        error: error.message || "Failed to create employee account" 
      };
    }
  },

  async updateEmployee(id: string, updates: Partial<EmployeeInsert>): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]> {
    const { data, error } = await supabase
      .from("employee_permissions")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) throw error;
    return data || [];
  },

  async updateEmployeePermissions(
    employeeId: string,
    permissions: { module: string; can_read: boolean; can_write: boolean }[]
  ): Promise<void> {
    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from("employee_permissions")
      .delete()
      .eq("employee_id", employeeId);

    if (deleteError) throw deleteError;

    // Insert new permissions
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
  },

  async getCurrentUserPermissions(businessId: string): Promise<EmployeePermission[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!employee) return [];

    return this.getEmployeePermissions(employee.id);
  },

  async hasPermission(
    businessId: string,
    module: string,
    type: "read" | "write" = "read"
  ): Promise<boolean> {
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .maybeSingle();

    if (!business) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (business.owner_id === user.id) return true;

    const permissions = await this.getCurrentUserPermissions(businessId);
    const permission = permissions.find((p) => p.module === module);

    if (!permission) return false;

    return type === "read" ? permission.can_read : permission.can_write;
  },
};

export type { Employee, EmployeePermission };