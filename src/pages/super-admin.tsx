import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Shield, Users, DollarSign, CheckCircle2, AlertCircle, XCircle, Edit, LogOut, Save, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BusinessWithSubscription = Tables<"businesses"> & {
  subscriptions: Tables<"subscriptions">[];
};

type SubscriptionPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_branches: number;
  max_products: number;
  max_employees: number;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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
      const session = await authService.getCurrentSession();
      
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

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
      const [businessesData, plansData] = await Promise.all([
        supabase
          .from("businesses")
          .select(`*, subscriptions (*)`)
          .order("created_at", { ascending: false }),
        supabase
          .from("subscription_plans")
          .select("*")
          .order("sort_order", { ascending: true })
      ]);

      if (businessesData.error) throw businessesData.error;
      if (plansData.error) throw plansData.error;

      const loadedBusinesses = businessesData.data as BusinessWithSubscription[];
      setBusinesses(loadedBusinesses);
      
      const loadedPlans: SubscriptionPlan[] = (plansData.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price_monthly: Number(p.price_monthly),
        price_yearly: Number(p.price_yearly),
        features: Array.isArray(p.features) ? p.features.map(String) : [],
        max_branches: p.max_branches,
        max_products: p.max_products,
        max_employees: p.max_employees
      }));
      setPlans(loadedPlans);

      const totalBusinesses = loadedBusinesses.length;
      const activeBusinesses = loadedBusinesses.filter(b => 
        b.subscriptions[0]?.status === "active"
      ).length;
      const trialingBusinesses = loadedBusinesses.filter(b => 
        b.subscriptions[0]?.status === "trialing"
      ).length;

      const mrr = loadedBusinesses.reduce((sum, b) => {
        const subscription = b.subscriptions[0];
        if (subscription?.status === "active" && subscription.plan) {
          const plan = plansData.data?.find((p: any) => p.id === subscription.plan);
          return sum + (plan?.price_monthly || 0);
        }
        return sum;
      }, 0);

      setMetrics({ totalBusinesses, activeBusinesses, trialingBusinesses, mrr });
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

      toast({
        title: "Estado actualizado",
        description: `Negocio ${!currentStatus ? "activado" : "desactivado"} correctamente`,
      });

      await loadData();
    } catch (err) {
      console.error("Error updating business status:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setEditDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          price_monthly: editingPlan.price_monthly,
          price_yearly: editingPlan.price_yearly,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingPlan.id);

      if (error) throw error;

      toast({
        title: "Plan actualizado",
        description: `Los precios del plan ${editingPlan.name} se actualizaron correctamente`,
      });

      setEditDialogOpen(false);
      setEditingPlan(null);
      await loadData();
    } catch (err) {
      console.error("Error updating plan:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión como super admin",
      });
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
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

  const getPlanName = (planId: string | null) => {
    if (!planId) return "-";
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
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
        title="Super Admin - Nexum Cloud"
        description="Panel de administración de Nexum Cloud"
      />
      
      <div className="min-h-screen bg-background">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg leading-tight">Nexum Cloud</h2>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </header>

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
              <CardDescription>Configura los precios de cada plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio Mensual</TableHead>
                    <TableHead>Precio Anual</TableHead>
                    <TableHead>Límites</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="text-accent font-semibold">
                        ${plan.price_monthly}/mes
                      </TableCell>
                      <TableCell className="text-accent font-semibold">
                        ${plan.price_yearly}/año
                      </TableCell>
                      <TableCell className="text-sm text-muted">
                        {plan.max_branches === 999999 ? "∞" : plan.max_branches} sucursales · {" "}
                        {plan.max_products === 999999 ? "∞" : plan.max_products} productos · {" "}
                        {plan.max_employees === 999999 ? "∞" : plan.max_employees} empleados
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
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
                        <TableCell>{business.email || "-"}</TableCell>
                        <TableCell>{getPlanName(subscription?.plan || null)}</TableCell>
                        <TableCell>
                          {subscription ? getStatusBadge(subscription.status) : "-"}
                        </TableCell>
                        <TableCell>
                          {subscription?.trial_end 
                            ? new Date(subscription.trial_end).toLocaleDateString()
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

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Precios del Plan {editingPlan?.name}</DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="monthly">Precio Mensual (MXN)</Label>
                <Input
                  id="monthly"
                  type="number"
                  step="0.01"
                  value={editingPlan.price_monthly}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    price_monthly: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearly">Precio Anual (MXN)</Label>
                <Input
                  id="yearly"
                  type="number"
                  step="0.01"
                  value={editingPlan.price_yearly}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    price_yearly: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Ahorro: ${((editingPlan.price_monthly * 12) - editingPlan.price_yearly).toFixed(2)} por año
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Vista previa:</p>
                <p className="text-xs text-muted-foreground">
                  Mensual: ${editingPlan.price_monthly}/mes
                </p>
                <p className="text-xs text-muted-foreground">
                  Anual: ${editingPlan.price_yearly}/año (${(editingPlan.price_yearly / 12).toFixed(2)}/mes)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}