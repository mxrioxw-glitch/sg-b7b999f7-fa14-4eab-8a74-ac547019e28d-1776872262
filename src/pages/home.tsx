import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  CreditCard,
  Zap
} from "lucide-react";
import { businessService } from "@/services/businessService";
import { authService } from "@/services/authService";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
      }
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name);
      }
    };
    loadData();
  }, []);

  const features = [
    {
      title: "Punto de Venta",
      description: "Procesa ventas rápidamente con interfaz táctil",
      icon: ShoppingCart,
      href: "/pos",
      color: "text-accent"
    },
    {
      title: "Productos",
      description: "Gestiona tu catálogo con variantes y extras",
      icon: Package,
      href: "/products",
      color: "text-primary"
    },
    {
      title: "Clientes",
      description: "Administra clientes y puntos de fidelidad",
      icon: Users,
      href: "/customers",
      color: "text-secondary"
    },
    {
      title: "Inventario",
      description: "Controla stock y materias primas",
      icon: BarChart3,
      href: "/inventory",
      color: "text-accent"
    },
    {
      title: "Dashboard",
      description: "Visualiza estadísticas y reportes",
      icon: DollarSign,
      href: "/dashboard",
      color: "text-primary"
    },
    {
      title: "Corte de Caja",
      description: "Gestiona turnos y arqueos de caja",
      icon: CreditCard,
      href: "/cash-register",
      color: "text-secondary"
    },
    {
      title: "Configuración",
      description: "Personaliza tu negocio y empleados",
      icon: Settings,
      href: "/settings",
      color: "text-muted"
    }
  ];

  return (
    <ProtectedRoute>
      <SEO title="Inicio - NextCoffee" description="Panel de control POS" />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Bienvenido a NextCoffee
                </h1>
                <p className="text-muted-foreground text-lg">
                  Sistema POS completo para tu negocio
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Link key={feature.href} href={feature.href}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-primary/20">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-muted">
                              <Icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-base">
                            {feature.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <Card className="border-2 border-accent/20 bg-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-accent" />
                    <CardTitle>Acceso Rápido</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/pos">
                      <div className="p-4 rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer text-center">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-accent" />
                        <p className="font-semibold">Nueva Venta</p>
                      </div>
                    </Link>
                    <Link href="/products">
                      <div className="p-4 rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer text-center">
                        <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-semibold">Productos</p>
                      </div>
                    </Link>
                    <Link href="/customers">
                      <div className="p-4 rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-secondary" />
                        <p className="font-semibold">Clientes</p>
                      </div>
                    </Link>
                    <Link href="/dashboard">
                      <div className="p-4 rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-accent" />
                        <p className="font-semibold">Dashboard</p>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}