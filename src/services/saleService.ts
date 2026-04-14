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
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  items: {
    productId?: string;
    productName: string;
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
      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          business_id: saleData.businessId,
          employee_id: saleData.employeeId,
          customer_id: saleData.customerId,
          cash_register_id: saleData.cashRegisterId,
          subtotal: saleData.subtotal,
          tax_amount: saleData.taxAmount,
          total: saleData.total,
          notes: saleData.notes,
          status: "completed",
        })
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
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        business_id: data.businessId,
        employee_id: data.employeeId,
        customer_id: data.customerId,
        payment_method_id: data.paymentMethodId,
        subtotal: data.subtotal,
        tax_amount: data.taxAmount,
        total: data.total,
        status: "completed",
      })
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError);
      return { sale: null, error: saleError.message };
    }

    // Create sale items
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
        data.businessId,
        sale.id,
        data.items.map((item) => ({
          product_id: item.productId,
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
}