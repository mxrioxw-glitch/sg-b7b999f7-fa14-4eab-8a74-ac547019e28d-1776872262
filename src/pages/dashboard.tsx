import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  ArrowUp,
  ArrowDown,
  Package,
  Clock,
  TrendingDown
} from "lucide-react";
import { businessService } from "@/services/businessService";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";
import { requireActiveSubscription } from "@/middleware/subscription";
import { SEO } from "@/components/SEO";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export const getServerSideProps = requireActiveSubscription;

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  blue: "#3b82f6",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("Mi Negocio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name || "Mi Negocio");
        const dashboardStats = await getDashboardMetrics(business.id);
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate growth percentage
  const monthGrowth = stats && stats.previousMonthSales > 0
    ? ((stats.monthSales - stats.previousMonthSales) / stats.previousMonthSales) * 100
    : 0;

  const avgOrderValue = stats && stats.todayOrders > 0
    ? stats.todaySales / stats.todayOrders
    : 0;

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="pos">
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="pos">
      <SEO 
        title="Dashboard - Nexum Cloud"
        description="Panel de control de Nexum Cloud"
      />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              {/* Page Header */}
              <div className="space-y-2">
                <h1 className="font-heading text-3xl md:text-4xl font-bold">Dashboard Ejecutivo</h1>
                <p className="text-base md:text-lg text-muted-foreground">
                  Análisis en tiempo real de {businessName}
                </p>
              </div>

              {/* Enhanced Stats Cards */}
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today Sales Card */}
                <Card className="relative overflow-hidden border-none shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Ventas de Hoy
                      </CardTitle>
                      <div className="p-2.5 rounded-xl bg-accent shadow-lg shadow-accent/20">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                          ${stats?.todaySales?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{stats?.todayOrders || 0}</span> órdenes completadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Month Sales Card */}
                <Card className="relative overflow-hidden border-none shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Ventas del Mes
                      </CardTitle>
                      <div className="p-2.5 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                          ${stats?.monthSales?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                      {monthGrowth !== 0 && (
                        <div className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${monthGrowth > 0 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        `}>
                          {monthGrowth > 0 ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )}
                          <span>{Math.abs(monthGrowth).toFixed(1)}%</span>
                          <span className="opacity-70">vs mes anterior</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Anterior: <span className="font-semibold text-foreground">${stats?.previousMonthSales?.toFixed(2) || "0.00"}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Average Order Value Card */}
                <Card className="relative overflow-hidden border-none shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Ticket Promedio
                      </CardTitle>
                      <div className="p-2.5 rounded-xl bg-purple-500 shadow-lg shadow-purple-500/20">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                          ${avgOrderValue.toFixed(2)}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Basado en <span className="font-semibold text-foreground">{stats?.todayOrders || 0}</span> ventas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Products Sold Card */}
                <Card className="relative overflow-hidden border-none shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-500/5" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Productos Activos
                      </CardTitle>
                      <div className="p-2.5 rounded-xl bg-green-500 shadow-lg shadow-green-500/20">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                          {stats?.topProducts?.length || 0}
                        </div>
                        <span className="text-sm text-muted-foreground">en catálogo</span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Top 10 más vendidos abajo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Sales by Hour Chart */}
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Clock className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl">Ventas por Hora</CardTitle>
                        <CardDescription>Distribución de ventas del día</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats?.salesByHour && stats.salesByHour.length > 0 ? (
                      <div className="h-[300px] md:h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.salesByHour}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="hour" 
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                              tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis 
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                              tickLine={{ stroke: "hsl(var(--border))" }}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                              }}
                              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Ventas"]}
                            />
                            <Bar 
                              dataKey="total" 
                              fill={CHART_COLORS.accent}
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[300px] md:h-[350px] flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-muted-foreground font-medium">No hay ventas hoy</p>
                          <p className="text-sm text-muted-foreground">Los datos aparecerán al registrar ventas</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Products Chart */}
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl">Productos Más Vendidos</CardTitle>
                        <CardDescription>Top 10 productos del mes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                        {stats.topProducts.slice(0, 10).map((product: any, index: number) => {
                          const maxRevenue = Math.max(...stats.topProducts.map((p: any) => p.revenue));
                          const percentage = (product.revenue / maxRevenue) * 100;
                          
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`
                                    w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                                    ${index === 0 ? "bg-yellow-500 text-white" : 
                                      index === 1 ? "bg-gray-400 text-white" : 
                                      index === 2 ? "bg-orange-600 text-white" : 
                                      "bg-primary/10 text-primary"}
                                  `}>
                                    #{index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-1">
                                      {product.productName || "Producto"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {product.quantity} vendidos
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm font-bold shrink-0 ml-2">
                                  ${Number(product.revenue || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`
                                    absolute inset-y-0 left-0 rounded-full transition-all duration-500
                                    ${index === 0 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : 
                                      index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-300" : 
                                      index === 2 ? "bg-gradient-to-r from-orange-600 to-orange-500" : 
                                      "bg-gradient-to-r from-primary to-primary/80"}
                                  `}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-muted-foreground font-medium">No hay datos de productos</p>
                          <p className="text-sm text-muted-foreground">Los datos aparecerán al registrar ventas</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Insights */}
              {stats && stats.topProducts && stats.topProducts.length > 0 && (
                <Card className="shadow-lg border-none bg-gradient-to-br from-accent/5 to-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl">Resumen del Rendimiento</CardTitle>
                        <CardDescription>Métricas clave del negocio</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2 p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Producto más rentable</span>
                        </div>
                        <p className="text-lg font-bold line-clamp-1">
                          {stats.topProducts[0]?.productName || "N/A"}
                        </p>
                        <p className="text-sm text-accent font-semibold">
                          ${Number(stats.topProducts[0]?.revenue || 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="space-y-2 p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>Total unidades vendidas</span>
                        </div>
                        <p className="text-lg font-bold">
                          {stats.topProducts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)} unidades
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Este mes
                        </p>
                      </div>
                      
                      <div className="space-y-2 p-4 rounded-lg bg-card border border-border sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>Crecimiento mensual</span>
                        </div>
                        <p className={`text-lg font-bold ${monthGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {monthGrowth >= 0 ? "+" : ""}{monthGrowth.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          vs mes anterior
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}