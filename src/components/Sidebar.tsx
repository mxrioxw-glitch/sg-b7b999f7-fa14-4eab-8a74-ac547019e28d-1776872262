import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Package, Users, DollarSign, Settings, ShoppingCart, BarChart3, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { businessService } from "@/services/businessService";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

// Sidebar width constants - REDUCED for better space usage
export const SIDEBAR_WIDTH_EXPANDED = 200;
export const SIDEBAR_WIDTH_COLLAPSED = 70;

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const { hasModuleAccess, isOwner, loading } = usePermissions(businessId);
  const isMobileOrTablet = useIsMobileOrTablet();

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded));
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED}px`
      );
    }
  }, [isExpanded]);

  async function loadBusiness() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessId(business.id);
        setBusinessName(business.name);
        setLogoUrl(business.logo_url || "");
      }
    } catch (error) {
      console.error("Error loading business:", error);
    }
  }

  const menuItems = [
    { 
      name: "Inicio", 
      href: "/", 
      icon: Home,
      module: "dashboard",
      requirePermission: false,
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
      ownerOnly: true
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.ownerOnly && !isOwner) return false;
    if (!item.requirePermission) return true;
    if (isOwner) return true;
    if (loading) return false;
    return hasModuleAccess(item.module, "read");
  });

  const handleLinkClick = () => {
    if (isMobileOrTablet && onClose) {
      onClose();
    }
  };

  const NavigationContent = () => (
    <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
      {visibleMenuItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = router.pathname === item.href;
        
        return (
          <Link key={item.href} href={item.href} onClick={handleLinkClick}>
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isExpanded ? "gap-3" : "justify-center px-2"} ${
                  isActive ? "bg-primary/10 text-primary" : ""
                }`}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 ${isExpanded && "flex-shrink-0"}`} />
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );

  // Mobile/Tablet View (Drawer)
  if (isMobileOrTablet) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64 sm:w-72 z-[100]">
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <SheetTitle className="text-base truncate">{businessName || "Mi Negocio"}</SheetTitle>
                <p className="text-xs text-muted-foreground">Sistema POS</p>
              </div>
            </div>
          </SheetHeader>
          <NavigationContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop View (Sticky Sidebar)
  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col bg-card border-r sticky top-0 h-screen z-30"
    >
      {/* Logo + Business Name Section */}
      <div className="p-4 border-b h-16 flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{businessName || "Mi Negocio"}</p>
                <p className="text-xs text-muted-foreground truncate">Sistema POS</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <NavigationContent />

        {/* Collapse Button - Original Simple Icon */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-9"
            title={isExpanded ? "Contraer sidebar" : "Expandir sidebar"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}