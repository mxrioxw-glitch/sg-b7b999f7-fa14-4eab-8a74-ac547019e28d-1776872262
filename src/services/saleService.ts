import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { deductInventoryForSale } from "./inventoryService";

export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;
export type SaleItemExtra = Tables<"sale_item_extras">;

export interface SaleWithItems extends Sale {
  items?: (SaleItem & { extras?: SaleItemExtra[] })[];
}

export interface CreateSaleData {
  businessId: string;
  employeeId: string;
  customerId?: string;
  cashRegisterId?: string;
  paymentMethodId?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  items: {
    productId?: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
    extras?: {
      extraName: string;
      price: number;
    }[];
  }[];
}

export const saleService = {
  async createSale(saleData: CreateSaleData): Promise<{ sale: Sale | null; error: string | null }> {
    try {
      // Create the sale - only include UUID fields if they have valid values
      const saleInsertData: any = {
        business_id: saleData.businessId,
        subtotal: saleData.subtotal,
        tax_amount: saleData.taxAmount,
        total: saleData.total,
        notes: saleData.notes,
        status: "completed",
      };

      // Only add UUID fields if they have valid values
      if (saleData.employeeId) {
        saleInsertData.employee_id = saleData.employeeId;
      }
      if (saleData.customerId) {
        saleInsertData.customer_id = saleData.customerId;
      }
      if (saleData.cashRegisterId) {
        saleInsertData.cash_register_id = saleData.cashRegisterId;
      }

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert(saleInsertData)
        .select()
        .single();

      if (saleError) {
        console.error("Error creating sale:", saleError);
        return { sale: null, error: saleError.message };
      }

      // Create sale items
      for (const item of saleData.items) {
        const { data: saleItem, error: itemError } = await supabase
          .from("sale_items")
          .insert({
            sale_id: sale.id,
            product_id: item.productId,
            product_name: item.productName,
            variant_name: item.variantName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.subtotal,
            notes: item.notes,
          })
          .select()
          .single();

        if (itemError) {
          console.error("Error creating sale item:", itemError);
          continue;
        }

        // Create sale item extras
        if (item.extras && item.extras.length > 0) {
          const extrasToInsert = item.extras.map((extra) => ({
            sale_item_id: saleItem.id,
            extra_name: extra.extraName,
            price: extra.price,
          }));

          const { error: extrasError } = await supabase
            .from("sale_item_extras")
            .insert(extrasToInsert);

          if (extrasError) {
            console.error("Error creating sale item extras:", extrasError);
          }
        }
      }

      // Auto-deduct inventory
      try {
        await deductInventoryForSale(
          saleData.businessId,
          sale.id,
          saleData.items.map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
          }))
        );
      } catch (invError) {
        console.error("Error deducting inventory:", invError);
        // Don't fail the sale if inventory deduction fails
      }

      return { sale, error: null };
    } catch (error) {
      console.error("Unexpected error creating sale:", error);
      return { sale: null, error: "Error inesperado al crear la venta" };
    }
  },

  async getSales(businessId: string, limit = 100): Promise<SaleWithItems[]> {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          extras:sale_item_extras(*)
        )
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching sales:", error);
      return [];
    }

    return data || [];
  },

  async getSaleById(saleId: string): Promise<SaleWithItems | null> {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          extras:sale_item_extras(*)
        )
      `)
      .eq("id", saleId)
      .single();

    if (error) {
      console.error("Error fetching sale:", error);
      return null;
    }

    return data;
  },

  async cancelSale(saleId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("sales")
      .update({ status: "canceled" })
      .eq("id", saleId);

    if (error) {
      console.error("Error canceling sale:", error);
      return { error: error.message };
    }

    return { error: null };
  },
};

export async function createSale(data: {
  businessId: string;
  employeeId: string;
  customerId?: string;
  paymentMethodId?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  items: {
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
    extras?: { extraName: string; price: number }[];
  }[];
}): Promise<{ sale: Sale | null; error: string | null }> {
  try {
    // 1. Create sale
    const saleInsertData: any = {
      business_id: data.businessId,
      employee_id: data.employeeId,
      customer_id: data.customerId,
      subtotal: data.subtotal,
      tax_amount: data.taxAmount,
      total: data.total,
      status: "completed",
    };
    
    if (data.paymentMethodId) {
      saleInsertData.payment_method_id = data.paymentMethodId;
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert(saleInsertData)
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError);
      return { sale: null, error: saleError.message };
    }

    // 2. Create sale items and deduct inventory
    for (const item of data.items) {
      const { data: saleItem, error: itemError } = await supabase
        .from("sale_items")
        .insert({
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          variant_name: item.variantName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          notes: item.notes,
        })
        .select()
        .single();

      if (itemError) {
        console.error("Error creating sale item:", itemError);
        continue;
      }

      // 2.1. Create extras for this sale item
      if (item.extras && item.extras.length > 0) {
        for (const extra of item.extras) {
          await supabase.from("sale_item_extras").insert({
            sale_item_id: saleItem.id,
            extra_name: extra.extraName,
            price: extra.price,
          });
        }
      }

      // 2.2. Deduct inventory - support variant-specific inventory
      const inventoryQuery = supabase
        .from("product_inventory_items")
        .select("inventory_item_id, quantity_per_unit")
        .eq("product_id", item.productId);

      // If variant is specified, get variant-specific inventory links first
      if (item.variantId) {
        const { data: variantLinks } = await supabase
          .from("product_inventory_items")
          .select("inventory_item_id, quantity_per_unit")
          .eq("product_id", item.productId)
          .eq("variant_id", item.variantId);

        if (variantLinks && variantLinks.length > 0) {
          // Use variant-specific inventory
          for (const link of variantLinks) {
            await deductSingleInventoryItem(
              data.businessId,
              sale.id,
              link.inventory_item_id,
              Number(link.quantity_per_unit) * item.quantity,
              `Venta de ${item.quantity}x ${item.productName} (${item.variantName})`
            );
          }
        }
      }

      // Get base product inventory (variant_id is null)
      const { data: baseLinks } = await supabase
        .from("product_inventory_items")
        .select("inventory_item_id, quantity_per_unit")
        .eq("product_id", item.productId)
        .is("variant_id", null);

      // Deduct base inventory items (common to all variants)
      for (const link of baseLinks || []) {
        await deductSingleInventoryItem(
          data.businessId,
          sale.id,
          link.inventory_item_id,
          Number(link.quantity_per_unit) * item.quantity,
          `Venta de ${item.quantity}x ${item.productName}`
        );
      }
    }

    return { sale, error: null };
  } catch (error) {
    console.error("Error in createSale:", error);
    return { sale: null, error: "Error creating sale" };
  }
}

async function deductSingleInventoryItem(
  businessId: string,
  saleId: string,
  inventoryItemId: string,
  quantityToDeduct: number,
  notes: string
): Promise<void> {
  try {
    // Get current stock
    const { data: inventoryItem, error: fetchError } = await supabase
      .from("inventory_items")
      .select("current_stock")
      .eq("id", inventoryItemId)
      .single();

    if (fetchError || !inventoryItem) {
      console.error("Error fetching inventory item:", fetchError);
      return;
    }

    const newStock = Number(inventoryItem.current_stock) - quantityToDeduct;

    // Update stock
    await supabase
      .from("inventory_items")
      .update({ current_stock: newStock })
      .eq("id", inventoryItemId);

    // Record inventory movement
    await supabase.from("inventory_movements").insert({
      business_id: businessId,
      inventory_item_id: inventoryItemId,
      movement_type: "out",
      quantity: quantityToDeduct,
      reference_type: "sale",
      reference_id: saleId,
      notes: notes,
    });
  } catch (error) {
    console.error("Error deducting single inventory item:", error);
  }
}