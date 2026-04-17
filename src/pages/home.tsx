import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { requireActiveSubscription } from "@/middleware/subscription";
import { SEO } from "@/components/SEO";

export const getServerSideProps = requireActiveSubscription;

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businessName, setBusinessName] = useState("Tu Negocio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUser(session.user);
        
        const business = await businessService.getCurrentBusiness();
        if (business?.name) {
          setBusinessName(business.name);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  const quickActions = [
    {
      title: "Nueva Venta",
      description: "Iniciar punto de venta",
      icon: ShoppingCart,
      href: "/pos",
      color: "bg-accent",
    },
    {
      title: "Productos",
      description: "Gestionar inventario",
      icon: Package,
      href: "/products",
      color: "bg-primary",
    },
    {
      title: "Clientes",
      description: "Ver clientes",
      icon: Users,
      href: "/customers",
      color: "bg-secondary",
    },
    {
      title: "Corte de Caja",
      description: "Gestionar caja",
      icon: DollarSign,
      href: "/cash-register",
      color: "bg-muted",
    },
  ];

  return (
    <ProtectedRoute requiredPermission="pos">
      <SEO 
        title="Inicio - Nexum Cloud"
        description="Página de inicio de Nexum Cloud"
      />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Welcome Section */}
              <div className="space-y-2">
                <h1 className="font-heading text-4xl font-bold">
                  Bienvenido a {businessName}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gestiona tu negocio desde un solo lugar
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div>
                <h2 className="font-heading text-2xl font-bold mb-4">
                  Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Card
                        key={action.title}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(action.href)}
                      >
                        <CardHeader>
                          <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <CardTitle className="text-xl">{action.title}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Dashboard</CardTitle>
                        <CardDescription className="text-xs">Métricas y reportes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/dashboard")}
                    >
                      Ver Dashboard
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Historial</CardTitle>
                        <CardDescription className="text-xs">Consulta tus ventas</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/cash-register")}
                    >
                      Ver Historial
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Configuración</CardTitle>
                        <CardDescription className="text-xs">Personaliza tu sistema</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/settings")}
                    >
                      Configurar
                    </Button>
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