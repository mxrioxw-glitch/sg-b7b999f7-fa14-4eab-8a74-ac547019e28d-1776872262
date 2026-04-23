import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CashRegister = Tables<"cash_registers">;

export async function getCashRegisters(businessId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("cash_registers")
    .select(`
      *,
      employees (
        id,
        user_id,
        role,
        profiles (
          full_name,
          email
        )
      )
    `)
    .eq("business_id", businessId)
    .order("opened_at", { ascending: false });

  if (error) {
    console.error("Error fetching cash registers:", error);
    throw error;
  }

  return data || [];
}

export async function getActiveCashRegister(businessId: string, employeeId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("business_id", businessId)
    .eq("employee_id", employeeId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching active cash register:", error);
    throw error;
  }

  return data;
}

export async function openCashRegister(data: {
  businessId: string;
  employeeId: string;
  openingAmount: number;
  notes?: string;
}): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  // Check if there is already an open register for this employee
  const activeRegister = await getActiveCashRegister(data.businessId, data.employeeId);
  
  if (activeRegister) {
    throw new Error("There is already an open cash register for this employee");
  }

  const { data: newRegister, error } = await supabase
    .from("cash_registers")
    .insert({
      business_id: data.businessId,
      employee_id: data.employeeId,
      opening_amount: data.openingAmount,
      status: "open" as any,
      notes: data.notes || null,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error opening cash register:", error);
    throw error;
  }

  return newRegister;
}

export async function closeCashRegister(data: {
  registerId: string;
  closingAmount: number;
  notes?: string;
}): Promise<any> {
  // Get the register to calculate expected amount
  const { data: register, error: fetchError } = await supabase
    .from("cash_registers")
    .select("*, sales(*)")
    .eq("id", data.registerId)
    .single();

  if (fetchError) {
    console.error("Error fetching cash register:", fetchError);
    throw fetchError;
  }

  // Calculate expected amount (opening + total sales)
  const salesTotal = Array.isArray(register.sales) 
    ? register.sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0)
    : 0;
  
  const expectedAmount = Number(register.opening_amount) + salesTotal;
  const difference = data.closingAmount - expectedAmount;

  const { data: closedRegister, error: updateError } = await supabase
    .from("cash_registers")
    .update({
      status: "closed",
      closing_amount: data.closingAmount,
      expected_amount: expectedAmount,
      difference: difference,
      closed_at: new Date().toISOString(),
      notes: data.notes || register.notes,
    })
    .eq("id", data.registerId)
    .select()
    .single();

  if (updateError) {
    console.error("Error closing cash register:", updateError);
    throw updateError;
  }

  return closedRegister;
}

export async function getCashRegisterSales(registerId: string) {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      total,
      created_at,
      employees (
        profiles (
          full_name
        )
      ),
      sale_items (
        product_name,
        quantity,
        unit_price
      )
    `)
    .eq("cash_register_id", registerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cash register sales:", error);
    throw error;
  }

  return data || [];
}

export async function getCashRegisterReport(registerId: string) {
  const { data: register, error } = await supabase
    .from("cash_registers")
    .select(`
      *,
      employees (
        id,
        role,
        profiles (
          full_name,
          email
        )
      ),
      sales (
        id,
        total,
        created_at
      )
    `)
    .eq("id", registerId)
    .single();

  if (error) {
    console.error("Error fetching cash register report:", error);
    throw error;
  }

  const sales = Array.isArray(register.sales) ? register.sales : [];
  const totalSales = sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
  const transactionCount = sales.length;
  
  // Calculate cash in drawer
  const cashInDrawer = register.status === "closed" 
    ? Number(register.closing_amount || 0)
    : Number(register.opening_amount || 0) + totalSales;

  return {
    ...register,
    total_sales: totalSales,
    cash_in_drawer: cashInDrawer,
    transaction_count: transactionCount,
  };
}