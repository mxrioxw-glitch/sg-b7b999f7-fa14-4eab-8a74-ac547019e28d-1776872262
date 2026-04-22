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
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
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
    { icon: Package, label: "Inventario", href: "/inventory" },
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
        h-screen w-64 bg-card border-r border-border
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Nexum Cloud
          </h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation - con scroll personalizado */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-accent text-accent-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-3 space-y-2">
          <Button
            variant="ghost"
            size={isExpanded ? "default" : "icon"}
            className={cn("w-full", !isExpanded && "justify-center")}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {isExpanded && <span className="ml-2">Cerrar Sesión</span>}
          </Button>

          <Button
            variant="ghost"
            size={isExpanded ? "default" : "icon"}
            className={cn("w-full hidden md:flex", !isExpanded && "justify-center")}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2">Contraer</span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}