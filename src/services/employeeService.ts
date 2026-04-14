import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

export const employeeService = {
  async getEmployees(businessId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        user:profiles!employees_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }

    return data || [];
  },

  async createEmployee(employee: EmployeeInsert): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .insert(employee)
      .select()
      .single();

    if (error) {
      console.error("Error creating employee:", error);
      throw error;
    }

    return data;
  },

  async updateEmployee(id: string, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      throw error;
    }

    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  },

  async inviteEmployee(businessId: string, email: string, role: "admin" | "cashier"): Promise<void> {
    // Buscar si el usuario ya existe en profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error checking profile:", profileError);
      throw profileError;
    }

    if (profile) {
      // Usuario ya existe, crear empleado directamente
      await this.createEmployee({
        business_id: businessId,
        user_id: profile.id,
        role,
        is_active: true
      });
    } else {
      // Usuario no existe, enviar invitación por email
      // En producción, aquí se enviaría un email de invitación
      throw new Error("Usuario no encontrado. Debe registrarse primero.");
    }
  }
};