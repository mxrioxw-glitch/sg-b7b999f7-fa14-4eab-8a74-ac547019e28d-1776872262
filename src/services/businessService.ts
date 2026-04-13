import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Business = Tables<"businesses">;
export type Employee = Tables<"employees">;

export const businessService = {
  async getCurrentBusiness(): Promise<Business | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching business:", error);
      return null;
    }

    return data;
  },

  async createBusiness(businessData: {
    name: string;
    address?: string;
    phone?: string;
    tax_rate?: number;
  }): Promise<{ business: Business | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { business: null, error: "No authenticated user" };

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: businessData.name,
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
};