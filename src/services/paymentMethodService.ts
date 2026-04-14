import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
type PaymentMethodInsert = Database["public"]["Tables"]["payment_methods"]["Insert"];
type PaymentMethodUpdate = Database["public"]["Tables"]["payment_methods"]["Update"];

export const paymentMethodService = {
  async getPaymentMethods(businessId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }

    return data || [];
  },

  async createPaymentMethod(businessId: string, methodData: Omit<PaymentMethodInsert, "business_id">): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({ ...methodData, business_id: businessId })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      throw error;
    }

    return data;
  },

  async updatePaymentMethod(id: string, updates: PaymentMethodUpdate): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from("payment_methods")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }

    return data;
  },

  async deletePaymentMethod(id: string): Promise<void> {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }
};