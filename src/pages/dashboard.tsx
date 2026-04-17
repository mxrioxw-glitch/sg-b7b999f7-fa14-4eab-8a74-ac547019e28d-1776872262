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
  ArrowUpRight,
  ArrowDownRight,
  Package
} from "lucide-react";
import { businessService } from "@/services/businessService";
import { dashboardService } from "@/services/dashboardService";
import { requireActiveSubscription } from "@/middleware/subscription";
import { SEO } from "@/components/SEO";

export const getServerSideProps = requireActiveSubscription;

interface DashboardMetrics {
  todaySales: number;
  monthSales: number;
  totalCustomers: number;
  totalProducts: number;
  recentSales: any[];
  topProducts: any[];
}

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
        const dashboardStats = await dashboardService.getDashboardStats(business.id);
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="pos">
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="space-y-2">
                <h1 className="font-heading text-4xl font-bold">Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                  Análisis y métricas de tu negocio
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ventas de Hoy
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${stats?.todaySales?.toFixed(2) || "0.00"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+12% vs ayer</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ventas del Mes
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${stats?.monthSales?.toFixed(2) || "0.00"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+8% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Clientes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalCustomers || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+3 nuevos esta semana</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Productos
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalProducts || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      En inventario
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sales & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ventas Recientes</CardTitle>
                    <CardDescription>Últimas transacciones realizadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.recentSales && stats.recentSales.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recentSales.slice(0, 5).map((sale: any) => (
                          <div key={sale.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Venta #{sale.id.substring(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sale.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-sm font-bold">
                              ${Number(sale.total).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay ventas recientes
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Productos Más Vendidos</CardTitle>
                    <CardDescription>Top 5 productos del mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                      <div className="space-y-4">
                        {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                          <div key={product.product_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {product.product_name || "Producto"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.quantity} vendidos
                                </p>
                              </div>
                            </div>
                            <div className="text-sm font-bold">
                              ${Number(product.total_sales || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay datos de productos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}