import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { QuickCashRegister } from "@/components/QuickCashRegister";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { businessService } from "@/services/businessService";
import { employeeService } from "@/services/employeeService";
import { getCashRegisters, openCashRegister, closeCashRegister } from "@/services/cashRegisterService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { authService } from "@/services/authService";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockItems: number;
  yesterdayRevenue: number;
  activeShift: {
    id: string;
    openingAmount: number;
    openedAt: string;
  } | null;
}

interface RecentSale {
  id: string;
  total: number;
  created_at: string;
  items_count: number;
}

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

interface SalesByHour {
  hour: string;
  total: number;
}

const CHART_COLORS = {
  primary: "#2A1810",
  accent: "#4A9C64",
  secondary: "#4A3228",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [planName, setPlanName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    yesterdayRevenue: 0,
    activeShift: null,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [salesByHour, setSalesByHour] = useState<SalesByHour[]>([]);
  const [quickCashRegisterOpen, setQuickCashRegisterOpen] = useState(false);
  const [cashRegisterMode, setCashRegisterMode] = useState<"open" | "close">("open");
  const [processingCashRegister, setProcessingCashRegister] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(user.email || "");

      // CRITICAL: Check Super Admin FIRST before ANY other logic
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      // If Super Admin, redirect immediately
      if (profile?.is_super_admin === true) {
        console.log("👑 Super Admin detected on Home - redirecting to /super-admin");
        router.replace("/super-admin");
        return; // STOP - don't load business data
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(profileData?.full_name || user.email?.split("@")[0] || "Usuario");

      // Get business
      const business = await businessService.getBusinessByOwnerId(user.id);
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessName(business.name);
      setBusinessId(business.id);

      // Get employee ID
      const currentEmployee = await employeeService.getCurrentEmployee();
      if (currentEmployee) {
        setEmployeeId(currentEmployee.id);
      }

      setPlanName("Plan Ilimitado");

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get yesterday's stats for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total, created_at")
        .eq("business_id", business.id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .order("created_at", { ascending: false });

      const { data: yesterdaySalesData } = await supabase
        .from("sales")
        .select("total")
        .eq("business_id", business.id)
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());

      const todayOrders = salesData?.length || 0;
      const todayRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const yesterdayRevenue = yesterdaySalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      // Get total items sold today
      const { data: itemsData } = await supabase
        .from("sale_items")
        .select("quantity, sale_id")
        .in("sale_id", salesData?.map(s => s.id) || []);

      const todaySales = itemsData?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

      // Get sales by hour
      const hourlyData: { [key: string]: number } = {};
      salesData?.forEach((sale) => {
        const hour = new Date(sale.created_at).getHours();
        const hourKey = `${hour}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + Number(sale.total);
      });

      const salesByHourArray = Object.entries(hourlyData)
        .map(([hour, total]) => ({
          hour,
          total,
        }))
        .sort((a, b) => {
          const hourA = parseInt(a.hour.split(":")[0]);
          const hourB = parseInt(b.hour.split(":")[0]);
          return hourA - hourB;
        });

      setSalesByHour(salesByHourArray);

      // Get active cash register
      const registers = await getCashRegisters(business.id);
      const activeCashRegister = registers.find(r => r.status === "open");

      if (activeCashRegister) {
        const registerSales = (salesData || []).filter(
          s => s.id === activeCashRegister.id
        );
        const salesTotal = registerSales.reduce((sum, sale) => sum + Number(sale.total), 0);
        setExpectedAmount(Number(activeCashRegister.opening_amount) + salesTotal);
      }

      // Get low stock items
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select("id, name, current_stock, min_stock, unit")
        .eq("business_id", business.id);

      const lowStock = (inventoryData || []).filter(
        item => Number(item.current_stock) <= Number(item.min_stock)
      );

      setStats({
        todaySales,
        todayOrders,
        todayRevenue,
        yesterdayRevenue,
        lowStockItems: lowStock.length,
        activeShift: activeCashRegister ? {
          id: activeCashRegister.id,
          openingAmount: Number(activeCashRegister.opening_amount),
          openedAt: activeCashRegister.opening_time,
        } : null,
      });

      // Get recent sales
      const recentSalesData = (salesData || []).slice(0, 5).map(sale => ({
        id: sale.id,
        total: Number(sale.total),
        created_at: sale.created_at,
        items_count: itemsData?.filter(item => item.sale_id === sale.id).length || 0,
      }));
      setRecentSales(recentSalesData);

      // Set low stock items
      setLowStockItems(lowStock.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        current_stock: Number(item.current_stock),
        min_stock: Number(item.min_stock),
        unit: item.unit,
      })));

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickOpenCashRegister(amount: number, notes: string) {
    if (!businessId || !employeeId) {
      toast({
        title: "Error",
        description: "No se pudo identificar tu negocio o empleado",
        variant: "destructive",
      });
      return;
    }

    setProcessingCashRegister(true);
    try {
      await openCashRegister({
        businessId,
        employeeId,
        openingAmount: amount,
        notes,
      });

      toast({
        title: "Turno abierto",
        description: "El turno de caja se ha abierto correctamente",
      });

      setQuickCashRegisterOpen(false);
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error opening cash register:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el turno",
        variant: "destructive",
      });
    } finally {
      setProcessingCashRegister(false);
    }
  }

  async function handleQuickCloseCashRegister(amount: number, notes: string) {
    if (!stats.activeShift) return;

    setProcessingCashRegister(true);
    try {
      await closeCashRegister({
        registerId: stats.activeShift.id,
        closingAmount: amount,
        notes,
      });

      toast({
        title: "Turno cerrado",
        description: "El turno de caja se ha cerrado correctamente",
      });

      setQuickCashRegisterOpen(false);
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error closing cash register:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar el turno",
        variant: "destructive",
      });
    } finally {
      setProcessingCashRegister(false);
    }
  }

  function handleOpenCashRegisterDialog() {
    setCashRegisterMode("open");
    setQuickCashRegisterOpen(true);
  }

  function handleCloseCashRegisterDialog() {
    setCashRegisterMode("close");
    setQuickCashRegisterOpen(true);
  }

  // Calculate revenue change percentage
  const revenueChange = stats.yesterdayRevenue > 0
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100
    : 0;

  // Prepare pie chart data for revenue distribution
  const pieChartData = [
    { name: "Hoy", value: stats.todayRevenue, color: CHART_COLORS.accent },
    { name: "Ayer", value: stats.yesterdayRevenue, color: CHART_COLORS.secondary },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  const quickActions = [
    {
      title: "Punto de Venta",
      description: "Registrar ventas y cobrar",
      icon: ShoppingCart,
      href: "/pos",
      color: "bg-accent",
    },
    {
      title: "Productos",
      description: "Gestionar catálogo",
      icon: Package,
      href: "/products",
      color: "bg-blue-500",
    },
    {
      title: "Clientes",
      description: "Ver clientes",
      icon: Users,
      href: "/customers",
      color: "bg-purple-500",
    },
    {
      title: "Corte de Caja",
      description: "Abrir/cerrar turno",
      icon: DollarSign,
      href: "/cash-register",
      color: "bg-amber-500",
    },
  ];

  return (
    <>
      <Head>
        <title>Inicio - {businessName}</title>
      </Head>

      <SEO 
        title="Nexum Cloud - Sistema POS en la Nube"
        description="Sistema punto de venta completo en la nube. Gestiona ventas, inventario, clientes y más desde cualquier lugar."
      />

      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            planName={planName}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Cash Register Status */}
            {stats.activeShift ? (
              <Card className="border-accent bg-gradient-to-r from-accent/5 to-accent/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="p-3 rounded-full bg-accent/20">
                      <CheckCircle className="h-8 w-8 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-foreground">Turno de caja activo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Apertura: <span className="font-semibold text-foreground">${stats.activeShift.openingAmount.toFixed(2)}</span> • Abierto desde{" "}
                        {new Date(stats.activeShift.openedAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseCashRegisterDialog}
                      className="w-full sm:w-auto border-accent hover:bg-accent hover:text-white"
                    >
                      Cerrar Turno
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-500/20">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-foreground">No hay turno de caja activo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Abre un turno para empezar a registrar ventas en el POS
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleOpenCashRegisterDialog}
                      className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                    >
                      Abrir Turno
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Stats Cards */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Revenue Card - Con mini gráfica */}
              <Card className="relative overflow-hidden border-none shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Ventas del día
                    </CardTitle>
                    <div className="p-2.5 rounded-xl bg-accent shadow-lg shadow-accent/20">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <div className="text-4xl font-bold text-foreground tracking-tight">
                        ${stats.todayRevenue.toFixed(2)}
                      </div>
                    </div>
                    {revenueChange !== 0 && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${revenueChange > 0 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : revenueChange < 0 
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                          : "bg-gray-100 text-gray-700"
                        }
                      `}>
                        {revenueChange > 0 ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : revenueChange < 0 ? (
                          <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                        <span>{Math.abs(revenueChange).toFixed(1)}%</span>
                        <span className="opacity-70">vs ayer</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{stats.todayOrders}</span> órdenes completadas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Sold Card - Con barra de progreso visual */}
              <Card className="relative overflow-hidden border-none shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Productos vendidos
                    </CardTitle>
                    <div className="p-2.5 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <div className="text-4xl font-bold text-foreground tracking-tight">
                        {stats.todaySales}
                      </div>
                      <span className="text-sm text-muted-foreground">unidades</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso del día</span>
                        <span className="font-semibold text-blue-600">
                          {Math.min((stats.todaySales / 100) * 100, 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.min((stats.todaySales / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Meta diaria: <span className="font-semibold text-foreground">100</span> unidades
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Card - Con promedio destacado */}
              <Card className="relative overflow-hidden border-none shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Órdenes
                    </CardTitle>
                    <div className="p-2.5 rounded-xl bg-purple-500 shadow-lg shadow-purple-500/20">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <div className="text-4xl font-bold text-foreground tracking-tight">
                        {stats.todayOrders}
                      </div>
                      <span className="text-sm text-muted-foreground">ventas</span>
                    </div>
                    {stats.todayOrders > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Ticket promedio</p>
                        <div className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <DollarSign className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                            {(stats.todayRevenue / stats.todayOrders).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Última venta: <span className="font-semibold text-foreground">Hace {recentSales.length > 0 ? Math.floor((Date.now() - new Date(recentSales[0].created_at).getTime()) / 60000) : 0} min</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Card - Con alerta visual */}
              <Card className={`
                relative overflow-hidden border-none shadow-lg
                ${stats.lowStockItems > 0 ? "ring-2 ring-red-500/20" : ""}
              `}>
                <div className={`
                  absolute inset-0 
                  ${stats.lowStockItems > 0 
                    ? "bg-gradient-to-br from-red-500/10 to-red-500/5" 
                    : "bg-gradient-to-br from-green-500/10 to-green-500/5"
                  }
                `} />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Inventario
                    </CardTitle>
                    <div className={`
                      p-2.5 rounded-xl shadow-lg
                      ${stats.lowStockItems > 0 
                        ? "bg-red-500 shadow-red-500/20 animate-pulse" 
                        : "bg-green-500 shadow-green-500/20"
                      }
                    `}>
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <div className={`
                        text-4xl font-bold tracking-tight
                        ${stats.lowStockItems > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                      `}>
                        {stats.lowStockItems}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.lowStockItems > 0 ? "alertas" : "ok"}
                      </span>
                    </div>
                    <div className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                      ${stats.lowStockItems > 0 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }
                    `}>
                      {stats.lowStockItems > 0 ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Requiere atención</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Stock adecuado</span>
                        </>
                      )}
                    </div>
                    {stats.lowStockItems > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <Link href="/inventory" className="block">
                          <Button variant="outline" size="sm" className="w-full text-xs border-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                            Ver detalles
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sales Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Ventas por Hora</CardTitle>
                  <CardDescription>Distribución de ventas durante el día</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesByHour.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesByHour}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="hour" 
                          className="text-xs"
                          tick={{ fill: "currentColor" }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: "currentColor" }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem"
                          }}
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                        <Bar 
                          dataKey="total" 
                          fill={CHART_COLORS.accent} 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay datos de ventas por hora</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Comparison Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativa</CardTitle>
                  <CardDescription>Hoy vs Ayer</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.todayRevenue > 0 || stats.yesterdayRevenue > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem"
                          }}
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Sin datos para comparar</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Accesos Rápidos</CardTitle>
                  <CardDescription>
                    Accede rápidamente a las funciones principales
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                        <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{action.title}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ventas Recientes</CardTitle>
                      <CardDescription>Últimas 5 transacciones</CardDescription>
                    </div>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm">
                        Ver todas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentSales.length > 0 ? (
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-accent/20">
                              <ShoppingCart className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-semibold">${sale.total.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {sale.items_count} {sale.items_count === 1 ? "producto" : "productos"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(sale.created_at).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay ventas registradas hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <Card className="border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle>Productos con Bajo Stock</CardTitle>
                    </div>
                    <Link href="/inventory">
                      <Button variant="outline" size="sm" className="border-amber-600 hover:bg-amber-100">
                        Ver Inventario
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>
                    Estos insumos necesitan reabastecimiento pronto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-background border shadow-sm"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Mínimo: {item.min_stock} {item.unit}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-base px-3 py-1">
                          {item.current_stock} {item.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Quick Cash Register Dialog */}
      <QuickCashRegister
        open={quickCashRegisterOpen}
        onOpenChange={setQuickCashRegisterOpen}
        mode={cashRegisterMode}
        currentAmount={expectedAmount}
        onConfirm={cashRegisterMode === "open" ? handleQuickOpenCashRegister : handleQuickCloseCashRegister}
        processing={processingCashRegister}
      />
    </>
  );
}