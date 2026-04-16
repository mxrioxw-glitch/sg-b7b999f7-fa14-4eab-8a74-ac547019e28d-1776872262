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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
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
} from "lucide-react";

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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, []);

  async function loadBusinessData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const business = await businessService.getCurrentUserBusiness();
      if (business) {
        setBusinessId(business.id);
        setIsOwner(business.owner_id === user.id);
      }
    } catch (error) {
      console.error("Error loading business:", error);
    }
  }

  const { permissions, loading: permissionsLoading } = usePermissions(businessId);

  // Helper function to check if user has access to a module
  const hasModuleAccess = (module: string): boolean => {
    // Owners always have access
    if (isOwner) return true;
    
    // Check employee permissions
    const perm = permissions.find(p => p.module === module);
    return perm ? perm.can_read : false;
  };

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
      name: "Dashboard", 
      icon: LayoutDashboard, 
      path: "/dashboard",
      permission: "reports"
    },
    { 
      name: "Punto de Venta", 
      icon: ShoppingCart, 
      path: "/pos",
      permission: "pos"
    },
    { 
      name: "Productos", 
      icon: Package, 
      path: "/products",
      permission: "products"
    },
    { 
      name: "Inventario", 
      icon: Store, 
      path: "/inventory",
      permission: "inventory"
    },
    { 
      name: "Clientes", 
      icon: Users, 
      path: "/customers",
      permission: "customers"
    },
    { 
      name: "Corte de Caja", 
      icon: Wallet, 
      path: "/cash-register",
      permission: "cash_register"
    },
    { 
      name: "Configuración", 
      icon: Settings, 
      path: "/settings",
      permission: "settings"
    },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => hasModuleAccess(item.permission));

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
        const isActive = router.pathname === item.path;

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              isCollapsed ? "justify-center" : "gap-3",
              isActive
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
        isExpanded ? "w-64" : "w-[70px]"
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