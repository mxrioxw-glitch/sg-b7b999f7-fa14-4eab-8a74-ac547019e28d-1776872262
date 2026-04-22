import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  X,
  CreditCard,
  User,
  UtensilsCrossed,
  ChefHat,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Inicio", href: "/" },
    { icon: ShoppingCart, label: "POS", href: "/pos" },
    { icon: Package, label: "Productos", href: "/products" },
    { icon: Warehouse, label: "Inventario", href: "/inventory" },
    { icon: Users, label: "Clientes", href: "/customers" },
    { icon: DollarSign, label: "Corte de Caja", href: "/cash-register" },
    { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
    { icon: UtensilsCrossed, label: "Comedor", href: "/comedor" },
    { icon: ChefHat, label: "Pantalla de Cocina", href: "/kitchen-display" },
    { icon: MessageSquare, label: "WhatsApp", href: "/whatsapp-orders" },
  ];

  const navItems = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
    { name: "Productos", href: "/products", icon: Package },
    { name: "Inventario", href: "/inventory", icon: BarChart3 },
    { name: "Corte de Caja", href: "/cash-register", icon: DollarSign },
    { name: "Clientes", href: "/customers", icon: Users },
    { name: "Configuración", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-0
        h-screen bg-card border-r border-border
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-16" : "w-64"}
      `}>
        {/* Header */}
        <div className={`h-16 flex items-center border-b border-border transition-all duration-300 ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {!isCollapsed && (
            <h1 className="font-heading text-xl font-bold text-foreground">
              Nexum Cloud
            </h1>
          )}
          {isCollapsed && (
            <h1 className="font-heading text-xl font-bold text-accent">
              N
            </h1>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden lg:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation - con scroll personalizado */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <nav className={`space-y-1 transition-all duration-300 ${isCollapsed ? "px-2" : "px-3"}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center rounded-lg text-sm font-medium transition-all duration-200
                    ${isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"}
                    ${isActive 
                      ? "bg-accent text-accent-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className={`border-t border-border space-y-2 transition-all duration-300 ${isCollapsed ? "p-2" : "p-3"}`}>
          <Link href="/subscription">
            <Button 
              variant="outline" 
              className={`transition-all duration-300 ${isCollapsed ? "w-full px-0" : "w-full"}`}
              title={isCollapsed ? "Suscripción" : undefined}
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="ml-2">Suscripción</span>}
            </Button>
          </Link>
          <Link href="/profile">
            <Button 
              variant="outline" 
              className={`transition-all duration-300 ${isCollapsed ? "w-full px-0" : "w-full"}`}
              title={isCollapsed ? "Perfil" : undefined}
            >
              <User className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="ml-2">Perfil</span>}
            </Button>
          </Link>
          <Link href="/settings">
            <Button 
              variant="outline" 
              className={`transition-all duration-300 ${isCollapsed ? "w-full px-0" : "w-full"}`}
              title={isCollapsed ? "Configuración" : undefined}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="ml-2">Configuración</span>}
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className={`text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 ${isCollapsed ? "w-full px-0" : "w-full"}`}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}