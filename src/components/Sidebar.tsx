import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  DollarSign,
  TrendingUp,
  Home,
  BarChart3,
  X,
  CreditCard,
  User,
  UtensilsCrossed,
  ChefHat,
  MessageSquare,
  Sparkles
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
    { 
      icon: UtensilsCrossed, 
      label: "Comedor", 
      href: "/comedor",
      badge: "Próximamente",
      badgeVariant: "outline" as const
    },
    { 
      icon: ChefHat, 
      label: "Pantalla de Cocina", 
      href: "/kitchen-display",
      badge: "Próximamente",
      badgeVariant: "outline" as const
    },
    { 
      icon: MessageSquare, 
      label: "WhatsApp", 
      href: "/whatsapp-orders",
      badge: "Próximamente",
      badgeVariant: "outline" as const
    },
  ];

  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
    { name: "Productos", href: "/products", icon: Package },
    { name: "Inventario", href: "/inventory", icon: TrendingUp },
    { name: "Corte de Caja", href: "/cash-register", icon: DollarSign },
    { name: "Clientes", href: "/customers", icon: Users },
    { name: "Configuración", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-card border-r z-50
          transition-all duration-300 ease-in-out flex flex-col
          ${isExpanded ? "w-64" : "w-16"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative md:z-auto
        `}
      >
        {/* Header */}
        <div className="h-16 px-4 md:px-6 border-b flex items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            {isExpanded && (
              <div className="flex flex-col justify-center">
                <h1 className="font-heading font-bold text-lg leading-none m-0">Nexum Cloud</h1>
                <p className="text-xs text-muted-foreground leading-none mt-1">Sistema POS</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto px-3">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || "default"} 
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
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