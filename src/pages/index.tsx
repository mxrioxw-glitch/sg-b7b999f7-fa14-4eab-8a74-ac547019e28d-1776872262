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
import { subscriptionService } from "@/services/subscriptionService";
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
  XCircle,
  ArrowRight,
  Clock,
  Zap
} from "lucide-react";

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockItems: number;
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
    activeShift: null,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
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

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(profile?.full_name || user.email?.split("@")[0] || "Usuario");

      // Get business
      const business = await businessService.getBusinessByOwnerId(user.id);
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessName(business.name);
      setBusinessId(business.id);

      // Get employee ID - works for both owners and cashiers
      const currentEmployee = await employeeService.getCurrentEmployee();
      if (currentEmployee) {
        setEmployeeId(currentEmployee.id);
      } else {
        // If no employee record found, might be owner without employee entry
        // Create a temporary employee for owner
        const { data: ownerEmployee } = await supabase
          .from("employees")
          .select("id")
          .eq("business_id", business.id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (ownerEmployee) {
          setEmployeeId(ownerEmployee.id);
        }
      }

      // Get subscription
      const subscription = await subscriptionService.getCurrentSubscription();
      if (subscription) {
        const planNames: Record<string, string> = {
          basic: "Plan Básico",
          professional: "Plan Profesional",
          premium: "Plan Premium",
        };
        setPlanName(planNames[subscription.plan] || "Plan Básico");
      }

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total, created_at")
        .eq("business_id", business.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      const todayOrders = salesData?.length || 0;
      const todayRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      // Get total items sold today
      const { data: itemsData } = await supabase
        .from("sale_items")
        .select("quantity, sale_id")
        .in("sale_id", salesData?.map(s => s.id) || []);

      const todaySales = itemsData?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

      // Get active cash register
      const registers = await getCashRegisters(business.id);
      const activeCashRegister = registers.find(r => r.status === "open");

      // Calculate expected amount if there's an active register
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
        lowStockItems: lowStock.length,
        activeShift: activeCashRegister ? {
          id: activeCashRegister.id,
          openingAmount: Number(activeCashRegister.opening_amount),
          openedAt: activeCashRegister.opened_at,
        } : null,
      });

      // Get recent sales (last 5)
      const recentSalesData = (salesData || []).slice(0, 5).map(sale => ({
        id: sale.id,
        total: Number(sale.total),
        created_at: sale.created_at,
        items_count: itemsData?.filter(item => item.sale_id === sale.id).length || 0,
      }));
      setRecentSales(recentSalesData);

      // Set low stock items (top 5)
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
            {/* Hero Section */}
            <section className="text-center py-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Sistema POS en la Nube</span>
              </div>
              
              <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
                Nexum Cloud
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                El sistema punto de venta completo para tu negocio. 
                Gestiona ventas, inventario, clientes y reportes desde cualquier lugar.
              </p>
            </section>

            {/* Cash Register Status Alert */}
            {stats.activeShift ? (
              <Card className="border-accent bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="p-2 rounded-full bg-accent/20">
                      <CheckCircle className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Turno de caja activo</p>
                      <p className="text-sm text-muted-foreground">
                        Apertura: ${stats.activeShift.openingAmount.toFixed(2)} • Abierto desde{" "}
                        {new Date(stats.activeShift.openedAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCloseCashRegisterDialog}
                        className="flex-1 sm:flex-none"
                      >
                        Cerrar Turno
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="p-2 rounded-full bg-orange-500/20">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">No hay turno de caja activo</p>
                      <p className="text-sm text-muted-foreground">
                        Abre un turno para empezar a registrar ventas en el POS
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleOpenCashRegisterDialog}
                      className="w-full sm:w-auto"
                    >
                      Abrir Turno
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ventas del día</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.todayOrders} órdenes completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Productos vendidos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todaySales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unidades en total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ventas hoy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Bajo stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.lowStockItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Items requieren atención
                  </p>
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
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{action.title}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-accent/20">
                              <ShoppingCart className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium">${sale.total.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {sale.items_count} productos
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
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle>Productos con Bajo Stock</CardTitle>
                    </div>
                    <Link href="/inventory">
                      <Button variant="outline" size="sm">
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
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-background border"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Mínimo: {item.min_stock} {item.unit}
                          </p>
                        </div>
                        <Badge variant="destructive">
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