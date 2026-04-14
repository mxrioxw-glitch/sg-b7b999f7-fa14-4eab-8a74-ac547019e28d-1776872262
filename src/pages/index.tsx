import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
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
  Clock
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
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [planName, setPlanName] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    activeShift: null,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

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
      const { data: activeCashRegister } = await supabase
        .from("cash_registers")
        .select("id, opening_amount, opened_at")
        .eq("business_id", business.id)
        .eq("status", "open")
        .maybeSingle();

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

      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            planName={planName}
          />

          <main className="flex-1 p-8 space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                ¡Bienvenido, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Aquí está el resumen de tu negocio para hoy
              </p>
            </div>

            {/* Cash Register Status Alert */}
            {stats.activeShift ? (
              <Card className="border-accent bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
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
                    <Link href="/cash-register">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/20">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">No hay turno de caja activo</p>
                      <p className="text-sm text-muted-foreground">
                        Abre un turno para empezar a registrar ventas en el POS
                      </p>
                    </div>
                    <Link href="/cash-register">
                      <Button size="sm">
                        Abrir Turno
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
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
    </>
  );
}