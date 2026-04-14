import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];

export interface BusinessSettings {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_rate: number;
  tax_included: boolean;
  pos_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

export const settingsService = {
  async getBusinessSettings(businessId: string): Promise<BusinessSettings> {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) {
      console.error("Error fetching business settings:", error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      logo_url: data.logo_url,
      address: data.address,
      phone: data.phone,
      email: data.email,
      tax_rate: Number(data.tax_rate) || 0,
      tax_included: data.tax_included || false,
      pos_name: data.pos_name || "POS System",
      primary_color: data.primary_color || "#2A1810",
      secondary_color: data.secondary_color || "#4A3228",
      accent_color: data.accent_color || "#4A9C64"
    };
  },

  async updateBusinessInfo(businessId: string, updates: {
    name?: string;
    logo_url?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  }): Promise<Business> {
    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      console.error("Error updating business info:", error);
      throw error;
    }

    return data;
  },

  async updateTaxSettings(businessId: string, updates: {
    tax_rate?: number;
    tax_included?: boolean;
  }): Promise<Business> {
    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tax settings:", error);
      throw error;
    }

    return data;
  },

  async updateCustomization(businessId: string, updates: {
    pos_name?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  }): Promise<Business> {
    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      console.error("Error updating customization:", error);
      throw error;
    }

    return data;
  }
};