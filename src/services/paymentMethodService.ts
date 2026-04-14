import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PaymentMethod = Tables<"payment_methods">;

export const paymentMethodService = {
  async getPaymentMethods(businessId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return [];
    }

    return data || [];
  },

  async createPaymentMethod(
    businessId: string,
    methodData: {
      name: string;
      sortOrder?: number;
    }
  ): Promise<{ paymentMethod: PaymentMethod | null; error: string | null }> {
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({
        business_id: businessId,
        name: methodData.name,
        sort_order: methodData.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      return { paymentMethod: null, error: error.message };
    }

    return { paymentMethod: data, error: null };
  },
};