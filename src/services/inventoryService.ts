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

export interface InventoryMovement {
  id: string;
  business_id: string;
  inventory_item_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  reference_type: "sale" | "purchase" | "adjustment" | "production" | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
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
  const updated = await updateInventoryItem(itemId, { current_stock: newStock });

  // Record movement
  await recordInventoryMovement({
    business_id: item.business_id,
    inventory_item_id: itemId,
    movement_type: "adjustment",
    quantity: Math.abs(quantity),
    reference_type: "adjustment",
    reference_id: null,
    notes: `Manual ${type === "in" ? "entrada" : "salida"}`,
  });

  return updated;
}

// Record inventory movement (for kardex)
export async function recordInventoryMovement(movement: {
  business_id: string;
  inventory_item_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  reference_type: "sale" | "purchase" | "adjustment" | "production" | null;
  reference_id: string | null;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase
    .from("inventory_movements")
    .insert({
      business_id: movement.business_id,
      inventory_item_id: movement.inventory_item_id,
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      notes: movement.notes || null,
    });

  if (error) {
    console.error("Error recording inventory movement:", error);
    throw error;
  }
}

// Get inventory movements (kardex)
export async function getInventoryMovements(
  itemId: string,
  limit: number = 50
): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("inventory_item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching inventory movements:", error);
    throw error;
  }

  return (data || []) as unknown as InventoryMovement[];
}

// Deduct inventory for a sale (auto-deduct)
export async function deductInventoryForSale(
  businessId: string,
  saleId: string,
  items: { product_id: string; quantity: number }[]
): Promise<void> {
  // For each product sold, check if it has linked inventory items
  for (const item of items) {
    const { data: links, error: linkError } = await supabase
      .from("product_inventory_items")
      .select("inventory_item_id, quantity_per_unit")
      .eq("product_id", item.product_id);

    if (linkError) {
      console.error("Error fetching product inventory links:", linkError);
      continue;
    }

    // Deduct from linked inventory items
    for (const link of links || []) {
      const quantityToDeduct = Number(link.quantity_per_unit) * item.quantity;
      
      try {
        const inventoryItem = await getInventoryItem(link.inventory_item_id);
        if (!inventoryItem) continue;

        const newStock = Number(inventoryItem.current_stock) - quantityToDeduct;
        if (newStock < 0) {
          console.warn(`Insufficient stock for inventory item ${link.inventory_item_id}`);
          continue;
        }

        await updateInventoryItem(link.inventory_item_id, {
          current_stock: newStock,
        });

        await recordInventoryMovement({
          business_id: businessId,
          inventory_item_id: link.inventory_item_id,
          movement_type: "out",
          quantity: quantityToDeduct,
          reference_type: "sale",
          reference_id: saleId,
          notes: `Venta automática`,
        });
      } catch (error) {
        console.error("Error deducting inventory:", error);
      }
    }
  }
}