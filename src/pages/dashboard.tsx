import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { businessService } from "@/services/businessService";
import { authService } from "@/services/authService";
import { getDashboardMetrics, getSalesReport } from "@/services/dashboardService";
import { getLowStockItems } from "@/services/inventoryService";
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Package, AlertCircle, Star } from "lucide-react";

interface TodayStats {
  totalRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
  averageTicket: number;
}

interface ComparisonStats {
  yesterdayRevenue: number;
  weekRevenue: number;
  revenueChange: number;
}

interface HourlySale {
  hour: number;
  total: number;
  count: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface RecentSale {
  id: string;
  time: string;
  total: number;
  items: number;
}

interface LowStockItem {
  name: string;
  current: number;
  min: number;
  unit: string;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Stats states
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueCustomers: 0,
    averageTicket: 0,
  });
  const [comparisonStats, setComparisonStats] = useState<ComparisonStats>({
    yesterdayRevenue: 0,
    weekRevenue: 0,
    revenueChange: 0,
  });
  const [hourlySales, setHourlySales] = useState<HourlySale[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user and business data
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setUserName(
          session.user.user_metadata?.full_name ||
          session.user.email?.split("@")[0] ||
          ""
        );
      }

      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name);

        // Load dashboard stats
        const metrics = await getDashboardMetrics(business.id);
        
        setTodayStats({
          totalRevenue: metrics.todaySales || 0,
          totalOrders: metrics.todayOrders || 0,
          uniqueCustomers: metrics.todayOrders || 0,
          averageTicket: metrics.todayOrders > 0 ? metrics.todaySales / metrics.todayOrders : 0,
        });

        // Using previous month / 30 as a mock for yesterday for the comparison arrow
        const simulatedYesterday = (metrics.previousMonthSales || 0) / 30;
        const revenueChange = simulatedYesterday > 0 
          ? (((metrics.todaySales || 0) - simulatedYesterday) / simulatedYesterday) * 100 
          : 0;

        setComparisonStats({
          yesterdayRevenue: simulatedYesterday,
          weekRevenue: (metrics.monthSales || 0) / 4,
          revenueChange,
        });

        // Load hourly sales
        const hourly = (metrics.salesByHour || []).map(s => ({
          hour: parseInt(s.hour.split(':')[0]),
          total: s.total,
          count: 1
        }));
        setHourlySales(hourly);

        // Load top products
        const top = (metrics.topProducts || []).slice(0, 5).map(p => ({
          name: p.productName,
          quantity: p.quantity,
          revenue: p.revenue
        }));
        setTopProducts(top);

        // Load recent sales
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const recentSalesData = await getSalesReport(business.id, todayStart, new Date());
        
        setRecentSales((recentSalesData || []).slice(0, 5).map(s => ({
          id: s.id,
          time: new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          total: Number(s.total),
          items: 1
        })));

        // Load low stock items
        const lowStock = await getLowStockItems(business.id);
        setLowStockItems((lowStock || []).slice(0, 5).map(item => ({
          name: item.name,
          current: Number(item.current_stock),
          min: Number(item.min_stock),
          unit: item.unit || 'unidades'
        })));
      }

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxHourlySale = Math.max(...hourlySales.map(h => h.total), 1);

  return (
    <ProtectedRoute>
      <SEO title="Dashboard - NextCoffee" description="Panel de control" />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col">
          <Header
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            onMenuClick={() => setIsSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Resumen de tu negocio hoy
                </p>
              </div>
            </div>

            {/* Main Stats - 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ingresos de Hoy */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ingresos de Hoy
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ${todayStats.totalRevenue.toFixed(2)}
                  </div>
                  {comparisonStats.yesterdayRevenue > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {comparisonStats.revenueChange >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-accent" />
                          <span className="text-sm text-accent font-medium">
                            +{comparisonStats.revenueChange.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive font-medium">
                            {comparisonStats.revenueChange.toFixed(1)}%
                          </span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground ml-1">vs ayer</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Órdenes de Hoy */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Órdenes de Hoy
                  </CardTitle>
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {todayStats.totalOrders}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Ticket promedio: ${todayStats.averageTicket.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Clientes Hoy */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clientes Hoy
                  </CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {todayStats.uniqueCustomers}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Clientes únicos atendidos
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Ingresos Semana */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ingresos Semana
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ${comparisonStats.weekRevenue.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Últimos 7 días (est.)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por Hora */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Ventas por Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hourlySales.length > 0 ? (
                    <div className="space-y-3">
                      {hourlySales.map((sale) => (
                        <div key={sale.hour} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {sale.hour.toString().padStart(2, '0')}:00 - {(sale.hour + 1).toString().padStart(2, '0')}:00
                            </span>
                            <span className="font-medium">
                              ${sale.total.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent/70 transition-all"
                              style={{ width: `${(sale.total / maxHourlySale) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay ventas registradas hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Productos */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top 5 Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {product.quantity} vendidos
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">
                              ${product.revenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay productos vendidos hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas Recientes */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Ventas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentSales.length > 0 ? (
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-foreground">
                              Venta #{sale.id.slice(0, 8)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {sale.time}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            ${sale.total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay ventas recientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertas de Inventario */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Alertas de Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length > 0 ? (
                    <div className="space-y-3">
                      {lowStockItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border-2 border-destructive/20 bg-destructive/5"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-foreground">
                              {item.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Mínimo: {item.min} {item.unit}
                            </div>
                          </div>
                          <Badge variant="destructive" className="ml-2">
                            {item.current} {item.unit}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50 text-accent" />
                      <p className="text-accent font-medium">¡Todo en orden!</p>
                      <p className="text-sm mt-1">No hay items con stock bajo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}