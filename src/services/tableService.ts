import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"]["tables"]["Row"];
type TableInsert = Database["public"]["Tables"]["tables"]["Insert"];
type TableUpdate = Database["public"]["Tables"]["tables"]["Update"];
type TableOrder = Database["public"]["Tables"]["table_orders"]["Row"];
type TableOrderInsert = Database["public"]["Tables"]["table_orders"]["Insert"];
type TableOrderItem = Database["public"]["Tables"]["table_order_items"]["Row"];
type TableOrderItemInsert = Database["public"]["Tables"]["table_order_items"]["Insert"];

export const tableService = {
  // ============= MESAS =============
  async getTables(businessId: string) {
    const { data, error } = await supabase
      .from("tables")
      .select(`
        *,
        table_orders!current_order_id(
          id,
          status,
          assigned_waiter_id,
          opened_at,
          total,
          guests_count,
          employees!table_orders_assigned_waiter_id_fkey(id, full_name)
        )
      `)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("table_number", { ascending: true });

    console.log("getTables:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async createTable(table: TableInsert) {
    const { data, error } = await supabase
      .from("tables")
      .insert(table)
      .select()
      .single();

    console.log("createTable:", { data, error });
    if (error) throw error;
    return data;
  },

  async updateTable(id: string, updates: TableUpdate) {
    const { data, error } = await supabase
      .from("tables")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("updateTable:", { data, error });
    if (error) throw error;
    return data;
  },

  async deleteTable(id: string) {
    const { error } = await supabase
      .from("tables")
      .update({ is_active: false })
      .eq("id", id);

    console.log("deleteTable:", { error });
    if (error) throw error;
  },

  // ============= ÓRDENES DE MESA =============
  async getTableOrder(tableId: string) {
    const { data, error } = await supabase
      .from("table_orders")
      .select(`
        *,
        employees(id, full_name),
        customers(id, full_name),
        table_order_items(
          *,
          table_order_item_extras(*)
        )
      `)
      .eq("table_id", tableId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .maybeSingle();

    console.log("getTableOrder:", { data, error });
    if (error) throw error;
    return data;
  },

  async openTable(order: TableOrderInsert) {
    const { data, error } = await supabase
      .from("table_orders")
      .insert(order)
      .select()
      .single();

    console.log("openTable:", { data, error });
    if (error) throw error;

    // Actualizar el estado de la mesa
    await supabase
      .from("tables")
      .update({ 
        status: "occupied",
        current_order_id: data.id 
      })
      .eq("id", order.table_id);

    return data;
  },

  async updateTableOrder(orderId: string, updates: Partial<TableOrder>) {
    const { data, error } = await supabase
      .from("table_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    console.log("updateTableOrder:", { data, error });
    if (error) throw error;
    return data;
  },

  async changeWaiter(orderId: string, newWaiterId: string) {
    return this.updateTableOrder(orderId, { 
      assigned_waiter_id: newWaiterId 
    });
  },

  // ============= ITEMS DE ORDEN =============
  async addItemToOrder(item: TableOrderItemInsert) {
    const { data, error } = await supabase
      .from("table_order_items")
      .insert(item)
      .select()
      .single();

    console.log("addItemToOrder:", { data, error });
    if (error) throw error;

    // Recalcular totales de la orden
    await this.recalculateOrderTotals(item.table_order_id);

    return data;
  },

  async updateOrderItem(itemId: string, updates: Partial<TableOrderItem>) {
    const { data, error } = await supabase
      .from("table_order_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    console.log("updateOrderItem:", { data, error });
    if (error) throw error;

    // Recalcular totales
    if (data) {
      await this.recalculateOrderTotals(data.table_order_id);
    }

    return data;
  },

  async deleteOrderItem(itemId: string) {
    // Obtener el order_id antes de eliminar
    const { data: item } = await supabase
      .from("table_order_items")
      .select("table_order_id")
      .eq("id", itemId)
      .single();

    const { error } = await supabase
      .from("table_order_items")
      .delete()
      .eq("id", itemId);

    console.log("deleteOrderItem:", { error });
    if (error) throw error;

    // Recalcular totales
    if (item) {
      await this.recalculateOrderTotals(item.table_order_id);
    }
  },

  async sendItemsToKitchen(itemIds: string[]) {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("table_order_items")
      .update({ 
        status: "sent_to_kitchen",
        sent_to_kitchen_at: now
      })
      .in("id", itemIds)
      .select();

    console.log("sendItemsToKitchen:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async markItemAsServed(itemId: string) {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("table_order_items")
      .update({ 
        status: "served",
        served_at: now
      })
      .eq("id", itemId)
      .select()
      .single();

    console.log("markItemAsServed:", { data, error });
    if (error) throw error;
    return data;
  },

  // ============= CÁLCULOS =============
  async recalculateOrderTotals(orderId: string) {
    const { data: items } = await supabase
      .from("table_order_items")
      .select("subtotal, tax_amount, total")
      .eq("table_order_id", orderId);

    if (!items || items.length === 0) {
      await supabase
        .from("table_orders")
        .update({ subtotal: 0, tax_amount: 0, total: 0 })
        .eq("id", orderId);
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const taxAmount = items.reduce((sum, item) => sum + Number(item.tax_amount), 0);
    const total = items.reduce((sum, item) => sum + Number(item.total), 0);

    await supabase
      .from("table_orders")
      .update({ 
        subtotal: Number(subtotal.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        total: Number(total.toFixed(2))
      })
      .eq("id", orderId);
  },

  // ============= COBRO Y CIERRE =============
  async closeTable(
    tableId: string, 
    orderId: string, 
    saleData: any
  ) {
    const now = new Date().toISOString();

    // Cerrar la orden
    await supabase
      .from("table_orders")
      .update({ 
        status: "closed",
        closed_at: now
      })
      .eq("id", orderId);

    // Liberar la mesa
    await supabase
      .from("tables")
      .update({ 
        status: "available",
        current_order_id: null
      })
      .eq("id", tableId);

    // Crear la venta en el sistema
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert(saleData)
      .select()
      .single();

    console.log("closeTable:", { sale, error: saleError });
    if (saleError) throw saleError;

    return sale;
  },

  async setTableDirty(tableId: string) {
    const { data, error } = await supabase
      .from("tables")
      .update({ status: "dirty" })
      .eq("id", tableId)
      .select()
      .single();

    console.log("setTableDirty:", { data, error });
    if (error) throw error;
    return data;
  },

  async setTableAvailable(tableId: string) {
    const { data, error } = await supabase
      .from("tables")
      .update({ status: "available" })
      .eq("id", tableId)
      .select()
      .single();

    console.log("setTableAvailable:", { data, error });
    if (error) throw error;
    return data;
  },
};