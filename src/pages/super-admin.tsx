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
  Calendar, Filter, BarChart3, PieChart, Activity, LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BusinessData = Tables<"businesses"> & {
  profiles?: Tables<"profiles">;
};

type MetricsData = {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
};

export default function SuperAdminPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    totalBusinesses: 0,
    activeBusinesses: 0,
    inactiveBusinesses: 0
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleLogout = async () => {
    try {
      toast({
        title: "👋 Cerrando sesión...",
        description: "Por favor espera",
        duration: 2000,
      });
      
      const { error } = await authService.signOut();
      
      if (error) {
        toast({
          title: "❌ Error",
          description: error.message || "No se pudo cerrar la sesión",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "✅ Sesión cerrada",
        description: "Hasta pronto",
        className: "bg-accent text-accent-foreground border-accent",
        duration: 2000,
      });
      
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

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

      // Check is_super_admin flag in database instead of hardcoded email
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.is_super_admin !== true) {
        console.log("❌ Not a Super Admin - redirecting to /");
        router.push("/");
        return;
      }

      console.log("✅ Super Admin verified - loading data");
      setAuthorized(true);
      await loadData();
    } catch (err) {
      console.error("Authorization error:", err);
      router.push("/auth/login");
    }
  };

  const loadData = async () => {
    try {
      const businessesData = await supabase
          .from("businesses")
          .select(`
            *,
            profiles:owner_id (*)
          `)
          .order("created_at", { ascending: false });

      if (businessesData.error) {
        console.error("Error cargando negocios:", businessesData.error);
        throw businessesData.error;
      }

      const loadedBusinesses = (businessesData.data || []) as unknown as BusinessData[];
      
      setBusinesses(loadedBusinesses);

      calculateMetrics(loadedBusinesses);
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

  const calculateMetrics = (businessList: BusinessData[]) => {
    const active = businessList.filter(b => b.is_active).length;
    const inactive = businessList.filter(b => !b.is_active).length;

    setMetrics({
      totalBusinesses: businessList.length,
      activeBusinesses: active,
      inactiveBusinesses: inactive,
    });
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
        if (statusFilter === "active") return b.is_active;
        if (statusFilter === "inactive") return !b.is_active;
        return true;
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
        title="Super Admin Dashboard - NextCoffee"
        description="Panel de administración de NextCoffee"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-heading font-bold text-foreground flex items-center gap-3">
                <Shield className="h-10 w-10 text-accent" />
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Panel de control y métricas del sistema
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Negocios */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Store className="h-6 w-6 text-accent" />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {metrics.totalBusinesses}
              </h3>
              <p className="text-sm text-muted-foreground">Total Negocios</p>
            </div>

            {/* Negocios Activos */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {metrics.activeBusinesses}
              </h3>
              <p className="text-sm text-muted-foreground">Negocios Activos</p>
            </div>

            {/* Negocios Inactivos */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {metrics.inactiveBusinesses}
              </h3>
              <p className="text-sm text-muted-foreground">Negocios Inactivos</p>
            </div>
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
                      <SelectItem value="inactive">Inactivos</SelectItem>
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
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No se encontraron negocios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBusinesses.map((business) => {
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
                            <TableCell>
                              <Badge variant={business.is_active ? "default" : "secondary"}>
                                {business.is_active ? "Activo" : "Inactivo"}
                              </Badge>
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
    </>
  );
}