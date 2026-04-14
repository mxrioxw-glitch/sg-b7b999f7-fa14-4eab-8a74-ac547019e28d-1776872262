import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";
import { businessService } from "@/services/businessService";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";

type Props = {
  initialMetrics: DashboardMetrics;
  businessId: string;
};

export default function Dashboard({ initialMetrics, businessId }: Props) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
    if (startDate && endDate) {
      loadMetrics();
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setMetrics(initialMetrics);
  };

  const percentageChange =
    metrics.previousMonthSales > 0
      ? ((metrics.monthSales - metrics.previousMonthSales) / metrics.previousMonthSales) * 100
      : 0;

  const maxHourSales = Math.max(...metrics.salesByHour.map((h) => h.total), 1);

  return (
    <>
      <Head>
        <title>Dashboard - POS SaaS</title>
      </Head>

      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Dashboard" />

          <main className="flex-1 overflow-y-auto p-6">
            {/* Filters */}
            <Card className="mb-6">
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

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sales by Hour Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ventas por hora</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.salesByHour.length > 0 ? (
                    <div className="space-y-2">
                      {metrics.salesByHour.map((item) => {
                        const percentage = (item.total / maxHourSales) * 100;
                        return (
                          <div key={item.hour} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{item.hour}</span>
                              <span className="text-muted-foreground">
                                ${item.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context);
  if ("redirect" in authResult) return authResult;

  const subscriptionResult = await requireActiveSubscription(context);
  if ("redirect" in subscriptionResult) return subscriptionResult;

  try {
    const business = await businessService.getBusinessByOwnerId(authResult.props.user.id);
    if (!business) {
      return { redirect: { destination: "/", permanent: false } };
    }

    const metrics = await getDashboardMetrics(business.id);

    return {
      props: {
        initialMetrics: metrics,
        businessId: business.id,
      },
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return { redirect: { destination: "/", permanent: false } };
  }
};