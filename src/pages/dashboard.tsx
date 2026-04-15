import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const business = await businessService.getBusinessByOwnerId(user.id);
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessId(business.id);
      const data = await getDashboardMetrics(business.id);
      setMetrics(data);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const data = await getDashboardMetrics(businessId, start, end);
      setMetrics(data);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (startDate && endDate && businessId) {
      loadMetrics();
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    if (businessId) {
      loadInitialData();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  if (!metrics) return null;

  const percentageChange =
    metrics.previousMonthSales > 0
      ? ((metrics.monthSales - metrics.previousMonthSales) / metrics.previousMonthSales) * 100
      : 0;

  const maxHourSales = metrics.salesByHour.length > 0 
    ? Math.max(...metrics.salesByHour.map((h) => h.total), 1) 
    : 1;

  return (
    <>
      <Head>
        <title>Dashboard - POS SaaS</title>
      </Head>

      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
            {/* Filters */}
            <Card className="mb-6 print:hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="startDate">Fecha inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="endDate">Fecha fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleFilter} disabled={loading || !startDate || !endDate}>
                    Aplicar filtro
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={loading}>
                    Resetear
                  </Button>
                  <Button variant="secondary" onClick={handlePrint} className="ml-auto flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ventas del día</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.todaySales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.todayOrders} órdenes completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Órdenes hoy</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.todayOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ventas completadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ventas del mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.monthSales.toFixed(2)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {percentageChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        percentageChange >= 0 ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {percentageChange >= 0 ? "+" : ""}
                      {percentageChange.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Mes anterior</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.previousMonthSales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Referencia comparativa</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
              {/* Sales by Hour Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ventas por hora</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.salesByHour.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.salesByHour} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="hour" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(value) => `$${value}`}
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Ventas"]}
                            labelFormatter={(label) => `Hora: ${label}`}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              borderColor: "hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))"
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay datos de ventas para mostrar
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top 10 Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.topProducts.map((product, index) => (
                        <div
                          key={product.productName}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} vendidos
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-accent">
                              ${product.revenue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay productos vendidos aún
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}