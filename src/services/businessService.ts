import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Business = Tables<"businesses">;
export type Employee = Tables<"employees">;

export const businessService = {
  async getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching business:", error);
      return null;
    }

    return data;
  },

  async getCurrentBusiness(): Promise<Business | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // First try to find business where user is owner
    const { data: ownedBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (ownedBusiness) return ownedBusiness;

    // If not owner, check if user is an employee
    const { data: employee } = await supabase
      .from("employees")
      .select("business_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!employee) return null;

    // Get the business for this employee
    const { data: employeeBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", employee.business_id)
      .maybeSingle();

    return employeeBusiness;
  },

  async createBusiness(businessData: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
    tax_rate?: number;
  }): Promise<{ business: Business | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { business: null, error: "No authenticated user" };

    const slug = businessData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: businessData.name,
        slug,
        email: businessData.email,
        address: businessData.address,
        phone: businessData.phone,
        tax_rate: businessData.tax_rate || 16,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating business:", error);
      return { business: null, error: error.message };
    }

    return { business: data, error: null };
  },

  async updateBusiness(
    businessId: string,
    updates: Partial<Business>
  ): Promise<{ business: Business | null; error: string | null }> {
    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      console.error("Error updating business:", error);
      return { business: null, error: error.message };
    }

    return { business: data, error: null };
  },

  async getEmployees(businessId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      return [];
    }

    return data || [];
  },

  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching employee:", error);
      return null;
    }

    return data;
  },
};