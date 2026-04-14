import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type InventoryItem = Tables<"inventory_items">;

export interface CreateInventoryItem {
  business_id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
}

export interface UpdateInventoryItem {
  name?: string;
  unit?: string;
  current_stock?: number;
  min_stock?: number;
  cost_per_unit?: number;
}

export interface InventoryAdjustment {
  item_id: string;
  quantity: number;
  type: "in" | "out";
  notes?: string;
}

// Get all inventory items for a business
export async function getInventoryItems(businessId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  if (error) {
    console.error("Error fetching inventory items:", error);
    throw error;
  }

  return data || [];
}

// Get inventory items with low stock
export async function getLowStockItems(businessId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("business_id", businessId)
    .filter("current_stock", "lte", "min_stock")
    .order("current_stock");

  if (error) {
    console.error("Error fetching low stock items:", error);
    throw error;
  }

  return data || [];
}

// Get single inventory item
export async function getInventoryItem(itemId: string): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error) {
    console.error("Error fetching inventory item:", error);
    throw error;
  }

  return data;
}

// Create inventory item
export async function createInventoryItem(item: CreateInventoryItem): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error("Error creating inventory item:", error);
    throw error;
  }

  return data;
}

// Update inventory item
export async function updateInventoryItem(
  itemId: string,
  updates: UpdateInventoryItem
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }

  return data;
}

// Delete inventory item
export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
}

// Adjust inventory stock (manual adjustment)
export async function adjustInventoryStock(
  itemId: string,
  quantity: number,
  type: "in" | "out"
): Promise<InventoryItem> {
  // Get current item
  const item = await getInventoryItem(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }

  // Calculate new stock
  const currentStock = Number(item.current_stock) || 0;
  const adjustment = type === "in" ? quantity : -quantity;
  const newStock = currentStock + adjustment;

  if (newStock < 0) {
    throw new Error("Insufficient stock");
  }

  // Update stock
  return updateInventoryItem(itemId, { current_stock: newStock });
}