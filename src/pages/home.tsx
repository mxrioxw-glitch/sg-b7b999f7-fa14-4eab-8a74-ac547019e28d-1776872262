import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock, AlertCircle, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { saleService } from "@/services/saleService";
import { getInventoryItems } from "@/services/inventoryService";
import { employeeService } from "@/services/employeeService";

interface CashRegister {
  id: string;
  opening_time: string;
  status: string;
}

async function getCashRegisters(businessId: string): Promise<CashRegister[]> {
  const { data, error } = await supabase
    .from("cash_registers")
    .select("id, opening_time, status")
    .eq("business_id", businessId)
    .order("opening_time", { ascending: false });

  if (error) {
    console.error("Error fetching cash registers:", error);
    return [];
  }

  return data || [];
}

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [planName, setPlanName] = useState("");
  
  const [todaySales, setTodaySales] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [hasOpenRegister, setHasOpenRegister] = useState(false);
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [cashRegisterTime, setCashRegisterTime] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  async function checkAccessAndLoadData() {
    try {
      setLoading(true);

      // CRITICAL: Check Super Admin FIRST before ANY other logic
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is Super Admin
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

      // Regular user - load business and data
      const currentBusiness = await businessService.getCurrentBusiness();
      if (!currentBusiness) {
        router.push("/auth/login");
        return;
      }

      setBusinessName(currentBusiness.name);

      // Get employee ID
      const currentEmployee = await employeeService.getCurrentEmployee();
      if (currentEmployee) {
        setEmployeeId(currentEmployee.id);
      }

      setPlanName("Plan Ilimitado");

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [salesData, inventoryData, cashRegistersData] = await Promise.all([
        saleService.getSales(currentBusiness.id),
        getInventoryItems(currentBusiness.id),
        getCashRegisters(currentBusiness.id)
      ]);

      // Calculate stats
      const todaySalesTotal = salesData
        .filter(sale => new Date(sale.created_at) >= today)
        .reduce((sum, sale) => sum + Number(sale.total), 0);
      
      setTodaySales(todaySalesTotal);

      const lowStockCount = inventoryData.filter(item => Number(item.current_stock) <= Number(item.min_stock)).length;
      setLowStockItems(lowStockCount);

      // Check active cash register
      const activeRegister = cashRegistersData.find(r => r.status === "open");
      if (activeRegister) {
        setHasOpenRegister(true);
        setCashRegisterId(activeRegister.id);
        const openTime = new Date(activeRegister.opening_time);
        setCashRegisterTime(openTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setHasOpenRegister(false);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Inicio - Nexum Cloud POS"
        description="Panel principal de tu sistema punto de venta"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido, {businessName}
            </h1>
            <p className="text-muted-foreground">
              {planName} • {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Cash Register Status */}
          {hasOpenRegister ? (
            <Card className="mb-8 border-accent bg-accent/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Caja Abierta</CardTitle>
                      <CardDescription>Desde las {cashRegisterTime}</CardDescription>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/cash-register?id=${cashRegisterId}`}>
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Card className="mb-8 border-destructive/30 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">No hay caja abierta</CardTitle>
                      <CardDescription>Abre una caja para comenzar a vender</CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="default">
                    <Link href="/cash-register">
                      Abrir Caja
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Ventas de Hoy</CardDescription>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  ${todaySales.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Productos Bajo Stock</CardDescription>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {lowStockItems}
                </div>
                {lowStockItems > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Requieren atención
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Estado de Caja</CardDescription>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {hasOpenRegister ? "Abierta" : "Cerrada"}
                </div>
                {hasOpenRegister && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Desde {cashRegisterTime}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Plan Actual</CardDescription>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  Ilimitado
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Activo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/pos")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Punto de Venta</CardTitle>
                    <CardDescription>Realizar ventas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/products")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Productos</CardTitle>
                    <CardDescription>Gestionar catálogo</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/inventory")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Inventario</CardTitle>
                    <CardDescription>Control de stock</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/customers")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Clientes</CardTitle>
                    <CardDescription>Base de datos</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}