import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  AlertCircle,
  Award,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { inventoryService } from "@/services/inventoryService";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";

// Mini Circular Progress Component
function CircularProgress({ 
  percentage, 
  color = "text-accent",
  size = 60 
}: { 
  percentage: number; 
  color?: string;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-500`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Stats state
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [yesterdayOrders, setYesterdayOrders] = useState(0);
  const [todayCustomers, setTodayCustomers] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [salesByHour, setSalesByHour] = useState<Array<{ hour: string; amount: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; quantity: number; revenue: number }>>([]);
  const [recentSales, setRecentSales] = useState<Array<{ time: string; total: number }>>([]);
  const [lowStockItems, setLowStockItems] = useState<Array<{ name: string; current: number; min: number }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
      }

      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name);
      }

      // Get today's stats
      const todayStats = await dashboardService.getTodayStats();
      setTodayRevenue(todayStats.totalRevenue || 0);
      setTodayOrders(todayStats.totalOrders || 0);
      setTodayCustomers(todayStats.uniqueCustomers || 0);
      setAverageTicket(todayStats.averageTicket || 0);

      // Get yesterday's revenue for comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
      
      const yesterdayStats = await dashboardService.getRevenueByDateRange(yesterdayStart, yesterdayEnd);
      setYesterdayRevenue(yesterdayStats || 0);

      // Estimate yesterday's orders (simple estimation based on average ticket)
      if (averageTicket > 0) {
        setYesterdayOrders(Math.round(yesterdayStats / averageTicket));
      }

      // Get week revenue (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStats = await dashboardService.getRevenueByDateRange(weekStart, new Date());
      setWeekRevenue(weekStats || 0);

      // Get sales by hour
      const hourlyData = await dashboardService.getSalesByHour();
      const formattedHourly = hourlyData.map(item => ({
        hour: `${item.hour}:00`,
        amount: item.total || 0
      }));
      setSalesByHour(formattedHourly);

      // Get top products
      const products = await dashboardService.getTopProducts(5);
      setTopProducts(products || []);

      // Get recent sales (simulated for now)
      const now = new Date();
      setRecentSales([
        { time: `${now.getHours() - 2}:${String(now.getMinutes()).padStart(2, '0')}`, total: 85.50 },
        { time: `${now.getHours() - 1}:${String(now.getMinutes()).padStart(2, '0')}`, total: 42.00 },
        { time: `${now.getHours()}:${String(now.getMinutes() - 15).padStart(2, '0')}`, total: 68.75 },
        { time: `${now.getHours()}:${String(now.getMinutes() - 5).padStart(2, '0')}`, total: 123.00 },
        { time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, total: 55.25 },
      ]);

      // Get low stock items
      const inventory = await inventoryService.getAllInventoryItems();
      const lowStock = inventory
        .filter(item => (item.current_stock || 0) < (item.min_stock || 0))
        .map(item => ({
          name: item.name,
          current: item.current_stock || 0,
          min: item.min_stock || 0
        }))
        .slice(0, 5);
      setLowStockItems(lowStock);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = calculateChange(todayRevenue, yesterdayRevenue);
  const ordersChange = calculateChange(todayOrders, yesterdayOrders);

  // Calculate progress percentages for circular charts
  const revenueProgress = yesterdayRevenue > 0 ? Math.min((todayRevenue / yesterdayRevenue) * 100, 100) : 50;
  const ordersProgress = yesterdayOrders > 0 ? Math.min((todayOrders / yesterdayOrders) * 100, 100) : 50;
  const customersProgress = 75; // Simulated
  const weekProgress = 85; // Simulated

  const maxHourlySale = Math.max(...salesByHour.map(s => s.amount), 1);

  return (
    <ProtectedRoute>
      <SEO title="Dashboard - NextCoffee" description="Panel de control y estadísticas" />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Bienvenido de vuelta, {userName}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stats Cards with Circular Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Revenue Card */}
                    <Card className="border-2 hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Ingresos de Hoy
                            </p>
                            <h3 className="text-2xl font-bold text-foreground">
                              ${todayRevenue.toFixed(2)}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                              {revenueChange >= 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-accent" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-destructive" />
                              )}
                              <span className={`text-xs font-medium ${revenueChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                {Math.abs(revenueChange).toFixed(1)}%
                              </span>
                              <span className="text-xs text-muted-foreground">vs ayer</span>
                            </div>
                          </div>
                          <CircularProgress 
                            percentage={revenueProgress} 
                            color="text-accent"
                            size={70}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders Card */}
                    <Card className="border-2 hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Órdenes de Hoy
                            </p>
                            <h3 className="text-2xl font-bold text-foreground">
                              {todayOrders}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium text-primary">
                                ${averageTicket.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">promedio</span>
                            </div>
                          </div>
                          <CircularProgress 
                            percentage={ordersProgress} 
                            color="text-primary"
                            size={70}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customers Card */}
                    <Card className="border-2 hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Clientes Hoy
                            </p>
                            <h3 className="text-2xl font-bold text-foreground">
                              {todayCustomers}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="text-xs text-muted-foreground">únicos</span>
                            </div>
                          </div>
                          <CircularProgress 
                            percentage={customersProgress} 
                            color="text-blue-500"
                            size={70}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Week Revenue Card */}
                    <Card className="border-2 hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Ingresos Semana
                            </p>
                            <h3 className="text-2xl font-bold text-foreground">
                              ${weekRevenue.toFixed(2)}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="h-4 w-4 text-purple-500" />
                              <span className="text-xs text-muted-foreground">últimos 7 días</span>
                            </div>
                          </div>
                          <CircularProgress 
                            percentage={weekProgress} 
                            color="text-purple-500"
                            size={70}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales by Hour - Area Chart */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Ventas por Hora
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {salesByHour.length === 0 ? (
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                            No hay datos de ventas hoy
                          </div>
                        ) : (
                          <div className="h-64 flex items-end justify-between gap-1 px-2">
                            {salesByHour.map((sale, index) => {
                              const heightPercentage = (sale.amount / maxHourlySale) * 100;
                              return (
                                <div 
                                  key={index} 
                                  className="flex-1 flex flex-col items-center gap-2 group"
                                >
                                  <div className="relative w-full">
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                      ${sale.amount.toFixed(2)}
                                    </div>
                                    {/* Bar */}
                                    <div 
                                      className="w-full bg-gradient-to-t from-accent to-accent/50 rounded-t-sm transition-all duration-300 hover:from-accent hover:to-accent/70"
                                      style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground rotate-0 lg:rotate-0">
                                    {sale.hour.split(':')[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Top 5 Productos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {topProducts.length === 0 ? (
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                            No hay datos de productos
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {topProducts.map((product, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                  <span className="text-sm font-bold text-accent">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.quantity} vendidos · ${product.revenue.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    ${product.revenue.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                          Ventas Recientes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentSales.map((sale, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{sale.time}</span>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                ${sale.total.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inventory Alerts */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          Alertas de Inventario
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {lowStockItems.length === 0 ? (
                          <div className="h-40 flex flex-col items-center justify-center text-center">
                            <Package className="h-12 w-12 text-accent mb-2" />
                            <p className="text-sm font-medium text-accent">¡Todo en orden!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              No hay items con stock bajo
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {lowStockItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Stock: {item.current} / Mínimo: {item.min}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="destructive" className="text-xs">
                                  Bajo
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}