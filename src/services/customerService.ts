import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;

export async function getCustomers(businessId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }

  return data || [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }

  return data;
}

export async function createCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at">): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    throw error;
  }

  return data;
}

export async function updateCustomer(id: string, updates: Partial<Omit<Customer, "id" | "business_id" | "created_at" | "updated_at">>): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating customer:", error);
    throw error;
  }

  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
}

export async function getCustomerPurchaseHistory(customerId: string) {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      total,
      created_at,
      sale_items (
        id,
        product_name,
        variant_name,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customer purchase history:", error);
    throw error;
  }

  return data || [];
}

export async function addLoyaltyPoints(customerId: string, points: number): Promise<Customer> {
  const customer = await getCustomerById(customerId);
  
  if (!customer) {
    throw new Error("Customer not found");
  }

  const newPoints = (customer.loyalty_points || 0) + points;

  return updateCustomer(customerId, { loyalty_points: newPoints });
}

export async function redeemLoyaltyPoints(customerId: string, points: number): Promise<Customer> {
  const customer = await getCustomerById(customerId);
  
  if (!customer) {
    throw new Error("Customer not found");
  }

  const currentPoints = customer.loyalty_points || 0;
  
  if (currentPoints < points) {
    throw new Error("Insufficient loyalty points");
  }

  const newPoints = currentPoints - points;

  return updateCustomer(customerId, { loyalty_points: newPoints });
}