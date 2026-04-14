import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCurrentSession } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Shield, Users, DollarSign, TrendingUp, Coffee, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

type BusinessWithSubscription = Tables<"businesses"> & {
  subscriptions: (Tables<"subscriptions"> & {
    subscription_plans: Tables<"subscription_plans"> | null;
  })[];
};

type SubscriptionPlan = Tables<"subscription_plans">;

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [metrics, setMetrics] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    trialingBusinesses: 0,
    mrr: 0
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: session, error } = await getCurrentSession();
      
      if (error || !session?.user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is super admin
      if (session.user.email !== "mxrioxw@gmail.com") {
        router.push("/");
        return;
      }

      setAuthorized(true);
      await loadData();
    } catch (err) {
      router.push("/auth/login");
    }
  };

  const loadData = async () => {
    try {
      // Load businesses with subscriptions
      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select(`
          *,
          subscriptions (
            *,
            subscription_plans (*)
          )
        `)
        .order("created_at", { ascending: false });

      if (businessesError) throw businessesError;

      const businesses = businessesData as BusinessWithSubscription[];
      setBusinesses(businesses);

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly");

      if (plansError) throw plansError;
      setPlans(plansData);

      // Calculate metrics
      const totalBusinesses = businesses.length;
      const activeBusinesses = businesses.filter(b => 
        b.subscriptions[0]?.status === "active"
      ).length;
      const trialingBusinesses = businesses.filter(b => 
        b.subscriptions[0]?.status === "trialing"
      ).length;

      const mrr = businesses.reduce((sum, b) => {
        const subscription = b.subscriptions[0];
        if (subscription?.status === "active" && subscription.subscription_plans) {
          return sum + (subscription.subscription_plans.price_monthly || 0);
        }
        return sum;
      }, 0);

      setMetrics({
        totalBusinesses,
        activeBusinesses,
        trialingBusinesses,
        mrr
      });

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setLoading(false);
    }
  };

  const toggleBusinessStatus = async (businessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ is_active: !currentStatus })
        .eq("id", businessId);

      if (error) throw error;

      await loadData();
    } catch (err) {
      console.error("Error updating business status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-accent text-white">Activo</Badge>;
      case "trialing":
        return <Badge variant="secondary">Prueba</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "past_due":
        return <Badge variant="outline" className="border-destructive text-destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Super Admin - POS SaaS"
        description="Panel de administración del sistema"
      />
      
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-card">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-sm text-muted">Panel de control del sistema</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
                <Users className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalBusinesses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeBusinesses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Prueba</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.trialingBusinesses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.mrr.toFixed(2)}</div>
                <p className="text-xs text-muted">Ingresos mensuales recurrentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Planes de Suscripción</CardTitle>
              <CardDescription>Gestión de planes y precios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio Mensual</TableHead>
                    <TableHead>Precio Anual</TableHead>
                    <TableHead>Características</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>${plan.price_monthly || 0}/mes</TableCell>
                      <TableCell>${plan.price_yearly || 0}/año</TableCell>
                      <TableCell className="text-sm text-muted max-w-md">
                        {plan.features ? JSON.stringify(plan.features).substring(0, 100) + "..." : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Businesses List */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Lista de todos los negocios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fin de Prueba</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => {
                    const subscription = business.subscriptions[0];
                    return (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.name}</TableCell>
                        <TableCell>{business.email}</TableCell>
                        <TableCell>{subscription?.subscription_plans?.name || "-"}</TableCell>
                        <TableCell>
                          {subscription ? getStatusBadge(subscription.status) : "-"}
                        </TableCell>
                        <TableCell>
                          {subscription?.trial_ends_at 
                            ? new Date(subscription.trial_ends_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={business.is_active ? "destructive" : "default"}
                            onClick={() => toggleBusinessStatus(business.id, business.is_active)}
                          >
                            {business.is_active ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Activar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}