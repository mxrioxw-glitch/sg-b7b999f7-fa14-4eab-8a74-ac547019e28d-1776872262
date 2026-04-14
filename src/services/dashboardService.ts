import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DashboardMetrics = {
  todaySales: number;
  todayOrders: number;
  monthSales: number;
  previousMonthSales: number;
  salesByHour: { hour: string; total: number }[];
  topProducts: { productName: string; quantity: number; revenue: number }[];
};

export const getDashboardMetrics = async (
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DashboardMetrics> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's sales
  const { data: todaySalesData } = await supabase
    .from("sales")
    .select("total")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  const todaySales = todaySalesData?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0;
  const todayOrders = todaySalesData?.length || 0;

  // Get month sales
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const { data: monthSalesData } = await supabase
    .from("sales")
    .select("total")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString())
    .lte("created_at", endOfMonth.toISOString());

  const monthSales = monthSalesData?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0;

  // Get previous month sales
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const { data: prevMonthSalesData } = await supabase
    .from("sales")
    .select("total")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", startOfPrevMonth.toISOString())
    .lte("created_at", endOfPrevMonth.toISOString());

  const previousMonthSales = prevMonthSalesData?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0;

  // Get sales by hour (today or filtered range)
  const rangeStart = startDate || today;
  const rangeEnd = endDate || tomorrow;

  const { data: salesByHourData } = await supabase
    .from("sales")
    .select("created_at, total")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", rangeStart.toISOString())
    .lt("created_at", rangeEnd.toISOString())
    .order("created_at", { ascending: true });

  const hourMap: { [key: string]: number } = {};
  salesByHourData?.forEach((sale) => {
    const hour = new Date(sale.created_at).getHours();
    const hourKey = `${hour.toString().padStart(2, "0")}:00`;
    hourMap[hourKey] = (hourMap[hourKey] || 0) + Number(sale.total || 0);
  });

  const salesByHour = Object.entries(hourMap)
    .map(([hour, total]) => ({ hour, total }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Get top products
  const { data: topProductsData } = await supabase
    .from("sale_items")
    .select(`
      product_name,
      quantity,
      unit_price,
      sale_id,
      sales!inner(business_id, status, created_at)
    `)
    .eq("sales.business_id", businessId)
    .eq("sales.status", "completed")
    .gte("sales.created_at", (startDate || startOfMonth).toISOString())
    .lte("sales.created_at", (endDate || endOfMonth).toISOString());

  const productMap: { [key: string]: { quantity: number; revenue: number } } = {};
  topProductsData?.forEach((item) => {
    const name = item.product_name;
    if (!productMap[name]) {
      productMap[name] = { quantity: 0, revenue: 0 };
    }
    productMap[name].quantity += Number(item.quantity || 0);
    productMap[name].revenue += Number(item.quantity || 0) * Number(item.unit_price || 0);
  });

  const topProducts = Object.entries(productMap)
    .map(([productName, data]) => ({
      productName,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    todaySales,
    todayOrders,
    monthSales,
    previousMonthSales,
    salesByHour,
    topProducts,
  };
};

export const getSalesReport = async (
  businessId: string,
  startDate: Date,
  endDate: Date
): Promise<Tables<"sales">[]> => {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      employees!inner(user_id, profiles!inner(full_name)),
      customers(name),
      sale_items(*)
    `)
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: false });

  console.log("Sales report:", { data, error });
  if (error) {
    console.error("Error fetching sales report:", error);
    throw error;
  }

  return data || [];
};