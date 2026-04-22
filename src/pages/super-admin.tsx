import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { 
  Shield, Users, DollarSign, CheckCircle2, AlertCircle, XCircle, 
  Edit, Store, TrendingUp, TrendingDown, Clock, Search,
  Calendar, Filter, BarChart3, PieChart, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BusinessWithSubscription = Tables<"businesses"> & {
  subscriptions: Tables<"subscriptions">[];
  profiles?: Tables<"profiles">;
};

type SubscriptionPlan = Tables<"subscription_plans">;

type MetricsData = {
  totalBusinesses: number;
  activeBusinesses: number;
  trialingBusinesses: number;
  canceledBusinesses: number;
  mrr: number;
  arr: number;
  conversionRate: number;
  growthRate: number;
};

type PlanStats = {
  planId: string;
  planName: string;
  count: number;
  revenue: number;
  percentage: number;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessWithSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData>({
    totalBusinesses: 0,
    activeBusinesses: 0,
    trialingBusinesses: 0,
    canceledBusinesses: 0,
    mrr: 0,
    arr: 0,
    conversionRate: 0,
    growthRate: 0
  });
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    checkAuthorization();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, searchQuery, statusFilter]);

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
          .select(`
            *,
            subscriptions (*),
            profiles:owner_id (*)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("subscription_plans")
          .select("*")
          .order("sort_order", { ascending: true })
      ]);

      if (businessesData.error) throw businessesData.error;
      if (plansData.error) throw plansData.error;

      const loadedBusinesses = businessesData.data as unknown as BusinessWithSubscription[];
      setBusinesses(loadedBusinesses);
      setPlans(plansData.data || []);

      calculateMetrics(loadedBusinesses, plansData.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const calculateMetrics = (businessList: BusinessWithSubscription[], plansList: SubscriptionPlan[]) => {
    const totalBusinesses = businessList.length;
    const activeBusinesses = businessList.filter(b => 
      b.subscriptions[0]?.status === "active"
    ).length;
    const trialingBusinesses = businessList.filter(b => 
      b.subscriptions[0]?.status === "trialing"
    ).length;
    const canceledBusinesses = businessList.filter(b => 
      b.subscriptions[0]?.status === "canceled"
    ).length;

    // Calculate MRR
    let mrr = 0;
    let arr = 0;
    businessList.forEach(b => {
      const subscription = b.subscriptions[0];
      if (subscription?.status === "active" && subscription.plan) {
        const plan = plansList.find(p => p.id === subscription.plan);
        if (plan) {
          if (subscription.billing_cycle === "yearly") {
            const monthlyEquivalent = Number(plan.price_yearly) / 12;
            mrr += monthlyEquivalent;
            arr += Number(plan.price_yearly);
          } else {
            mrr += Number(plan.price_monthly);
            arr += Number(plan.price_monthly) * 12;
          }
        }
      }
    });

    // Calculate conversion rate
    const totalCompleted = activeBusinesses + canceledBusinesses;
    const conversionRate = totalCompleted > 0 
      ? (activeBusinesses / totalCompleted) * 100 
      : 0;

    // Calculate growth rate (this month vs last month - simplified)
    const thisMonth = businessList.filter(b => {
      const createdDate = new Date(b.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonth = businessList.filter(b => {
      const createdDate = new Date(b.created_at);
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return createdDate.getMonth() === lastMonthDate.getMonth() && 
             createdDate.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    setMetrics({
      totalBusinesses,
      activeBusinesses,
      trialingBusinesses,
      canceledBusinesses,
      mrr,
      arr,
      conversionRate,
      growthRate
    });

    // Calculate plan stats
    const stats: { [key: string]: PlanStats } = {};
    plansList.forEach(plan => {
      stats[plan.id] = {
        planId: plan.id,
        planName: plan.name,
        count: 0,
        revenue: 0,
        percentage: 0
      };
    });

    businessList.forEach(b => {
      const subscription = b.subscriptions[0];
      if (subscription?.plan && stats[subscription.plan]) {
        stats[subscription.plan].count++;
        
        if (subscription.status === "active") {
          const plan = plansList.find(p => p.id === subscription.plan);
          if (plan) {
            if (subscription.billing_cycle === "yearly") {
              stats[subscription.plan].revenue += Number(plan.price_yearly) / 12;
            } else {
              stats[subscription.plan].revenue += Number(plan.price_monthly);
            }
          }
        }
      }
    });

    const totalCount = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
    Object.values(stats).forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    setPlanStats(Object.values(stats).sort((a, b) => b.count - a.count));
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.profiles?.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => {
        const subscription = b.subscriptions[0];
        return subscription?.status === statusFilter;
      });
    }

    setFilteredBusinesses(filtered);
  };

  const toggleBusinessStatus = async (businessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ is_active: !currentStatus })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "✅ Estado actualizado",
        description: `Negocio ${!currentStatus ? "activado" : "desactivado"}`,
        className: "bg-accent text-accent-foreground border-accent",
      });

      await loadData();
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "❌ Error",
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
        title: "✅ Plan actualizado",
        description: `Los precios de ${editingPlan.name} se actualizaron`,
        className: "bg-accent text-accent-foreground border-accent",
      });

      setEditDialogOpen(false);
      setEditingPlan(null);
      await loadData();
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar el plan",
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
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return "-";
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
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
        title="Super Admin Dashboard - Nexum Cloud"
        description="Panel de administración de Nexum Cloud"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg leading-tight">Super Admin</h2>
                <p className="text-xs text-muted-foreground">Nexum Cloud Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Activity className="h-3 w-3" />
                En vivo
              </Badge>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* MRR */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    MRR
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(metrics.mrr)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ARR: {formatCurrency(metrics.arr)}
                </p>
              </CardContent>
            </Card>

            {/* Total Businesses */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Negocios
                  </CardTitle>
                  <Store className="h-4 w-4 text-muted" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalBusinesses}</div>
                <div className="flex items-center gap-2 mt-1">
                  {metrics.growthRate >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-accent" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {metrics.growthRate >= 0 ? "+" : ""}{metrics.growthRate.toFixed(1)}% este mes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Businesses */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Negocios Activos
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.activeBusinesses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.activeBusinesses / metrics.totalBusinesses) * 100 || 0).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            {/* Trial Businesses */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En Prueba
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.trialingBusinesses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversión: {metrics.conversionRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Distribution & Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Plan Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Distribución por Plan</CardTitle>
                    <CardDescription>Usuarios activos en cada plan</CardDescription>
                  </div>
                  <PieChart className="h-5 w-5 text-muted" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planStats.map((stat) => (
                    <div key={stat.planId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stat.planName}</span>
                        <span className="text-muted-foreground">{stat.count} usuarios</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        MRR: {formatCurrency(stat.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuración de Planes</CardTitle>
                    <CardDescription>Editar precios y características</CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(Number(plan.price_monthly))}/mes · {formatCurrency(Number(plan.price_yearly))}/año
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Businesses Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Gestión de Clientes</CardTitle>
                  <CardDescription>Lista completa de negocios registrados</CardDescription>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar negocio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="trialing">En Prueba</SelectItem>
                      <SelectItem value="canceled">Cancelados</SelectItem>
                      <SelectItem value="past_due">Vencidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Fin Trial</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No se encontraron negocios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBusinesses.map((business) => {
                        const subscription = business.subscriptions[0];
                        return (
                          <TableRow key={business.id}>
                            <TableCell>
                              <div className="font-medium">{business.name}</div>
                              <div className="text-xs text-muted-foreground">{business.email || "-"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{business.profiles?.full_name || "-"}</div>
                              <div className="text-xs text-muted-foreground">{business.profiles?.email || "-"}</div>
                            </TableCell>
                            <TableCell>{getPlanName(subscription?.plan || null)}</TableCell>
                            <TableCell>
                              {subscription ? getStatusBadge(subscription.status) : "-"}
                            </TableCell>
                            <TableCell>
                              {subscription?.billing_cycle === "yearly" ? (
                                <Badge variant="outline">Anual</Badge>
                              ) : subscription?.billing_cycle === "monthly" ? (
                                <Badge variant="outline">Mensual</Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(subscription?.trial_end || null)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(business.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
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
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {filteredBusinesses.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {filteredBusinesses.length} de {businesses.length} negocios
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Precios del Plan</DialogTitle>
            <DialogDescription>
              Actualizar los precios de {editingPlan?.name}
            </DialogDescription>
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
                    price_monthly: e.target.value as any
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
                    price_yearly: e.target.value as any
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Ahorro anual: {formatCurrency(
                    (Number(editingPlan.price_monthly) * 12) - Number(editingPlan.price_yearly)
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Vista previa:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Mensual: {formatCurrency(Number(editingPlan.price_monthly))}/mes</p>
                  <p>Anual: {formatCurrency(Number(editingPlan.price_yearly))}/año ({formatCurrency(Number(editingPlan.price_yearly) / 12)}/mes)</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} className="bg-accent hover:bg-accent/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}