import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  BarChart3,
  Home,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessData();
  }, []);

  async function loadBusinessData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessId(business.id);
      }
    } catch (error) {
      console.error("Error loading business:", error);
    }
  }

  const { hasModuleAccess, isOwner, loading } = usePermissions(businessId);

  // Load saved state from localStorage (only for desktop)
  useEffect(() => {
    if (!isMobileOrTablet) {
      const saved = localStorage.getItem("sidebar-expanded");
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    }
  }, [isMobileOrTablet]);

  // Save state to localStorage (only for desktop)
  const toggleSidebar = () => {
    if (!isMobileOrTablet) {
      const newState = !isExpanded;
      setIsExpanded(newState);
      localStorage.setItem("sidebar-expanded", String(newState));
    }
  };

  const menuItems = [
    { 
      name: "Inicio", 
      href: "/", 
      icon: Home,
      module: "dashboard",
      requirePermission: false, // Dashboard always visible
      ownerOnly: false
    },
    { 
      name: "POS", 
      href: "/pos", 
      icon: ShoppingCart,
      module: "pos",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Productos", 
      href: "/products", 
      icon: Package,
      module: "products",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Inventario", 
      href: "/inventory", 
      icon: Store,
      module: "inventory",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Clientes", 
      href: "/customers", 
      icon: Users,
      module: "customers",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Corte de Caja", 
      href: "/cash-register", 
      icon: DollarSign,
      module: "cash_register",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Reportes", 
      href: "/dashboard", 
      icon: BarChart3,
      module: "reports",
      requirePermission: true,
      ownerOnly: false
    },
    { 
      name: "Configuración", 
      href: "/settings", 
      icon: Settings,
      module: "settings",
      requirePermission: false,
      ownerOnly: true // ✅ SOLO OWNERS
    },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    // Owner-only items
    if (item.ownerOnly && !isOwner) return false;
    
    if (!item.requirePermission) return true; // Always show items that don't require permission
    if (isOwner) return true; // Owners see everything
    if (loading) return false; // Hide while loading permissions
    return hasModuleAccess(item.module); // Check if employee has read permission
  });

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (isMobileOrTablet && onClose) {
      onClose();
    }
  };

  const NavigationContent = () => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {visibleMenuItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              isCollapsed ? "justify-center" : "gap-3",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  // Mobile/Tablet: Sheet (drawer) - COMPLETAMENTE OCULTO
  if (isMobileOrTablet) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64 sm:w-72">
          <SheetHeader className="p-4 md:p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
                <span className="text-lg font-bold text-primary-foreground">☕</span>
              </div>
              <SheetTitle className="text-xl font-bold text-primary">POS SaaS</SheetTitle>
            </div>
          </SheetHeader>
          <NavigationContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside 
      className={cn(
        "relative bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-[70px]",
        "min-h-screen"
      )}
    >
      {/* Header with logo and toggle */}
      <div className={cn(
        "relative border-b border-border flex items-center justify-between",
        isExpanded ? "p-6" : "p-3 justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-200",
          isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">☕</span>
          </div>
          {isExpanded && (
            <h1 className="text-xl font-bold text-primary whitespace-nowrap">POS SaaS</h1>
          )}
        </div>

        {!isExpanded && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">☕</span>
          </div>
        )}

        {/* Toggle button - only show when expanded */}
        {isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute right-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Toggle button when collapsed - positioned below header */}
      {!isExpanded && (
        <div className="relative h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute left-1/2 -translate-x-1/2 top-8 z-20 h-9 w-9 rounded-full bg-card border-2 border-primary/20 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all"
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </Button>
        </div>
      )}

      <NavigationContent />

      {/* Footer indicator */}
      <div className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-200",
        isExpanded ? "opacity-0" : "opacity-100"
      )}>
        <div className="h-1 w-6 rounded-full bg-muted" />
      </div>
    </aside>
  );
}