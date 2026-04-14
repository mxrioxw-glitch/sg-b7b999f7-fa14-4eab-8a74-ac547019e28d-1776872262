import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved state from localStorage (only for desktop)
  useEffect(() => {
    if (!isMobileOrTablet) {
      const saved = localStorage.getItem("sidebar-expanded");
      if (saved !== null) {
        setIsExpanded(saved === "true");
      } else {
        setIsExpanded(true); // Default expanded on desktop
      }
    } else {
      // Mobile/tablet: always collapsed by default
      setIsExpanded(false);
    }
  }, [isMobileOrTablet]);

  // Save state to localStorage (only for desktop)
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (!isMobileOrTablet) {
      localStorage.setItem("sidebar-expanded", String(newState));
    }
  };

  const menuItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/pos", icon: ShoppingCart, label: "Punto de Venta" },
    { href: "/products", icon: Package, label: "Productos" },
    { href: "/inventory", icon: Package, label: "Inventario" },
    { href: "/customers", icon: Users, label: "Clientes" },
    { href: "/cash-register", icon: DollarSign, label: "Corte de Caja" },
    { href: "/settings", icon: Settings, label: "Configuración" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "relative bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out z-40",
        isExpanded ? "w-64" : "w-16",
        isMobileOrTablet && "fixed left-0 top-0 bottom-0"
      )}
    >
      {/* Header with logo and toggle */}
      <div className={cn(
        "relative border-b border-border flex items-center justify-between",
        isExpanded ? "p-4 md:p-6" : "p-3 justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-200",
          isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">☕</span>
          </div>
          <h1 className="text-xl font-bold text-primary whitespace-nowrap">POS SaaS</h1>
        </div>

        {!isExpanded && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">☕</span>
          </div>
        )}

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute transition-all duration-300 flex-shrink-0",
            isExpanded ? "right-2" : "-right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-card border border-border shadow-md"
          )}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 md:p-4">
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-1 md:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 group w-full",
                    active 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted",
                    isExpanded 
                      ? "gap-3 px-3 md:px-4 py-2 md:py-3" 
                      : "justify-center px-2 py-2 md:py-3"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    active && "drop-shadow-sm"
                  )} />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200 text-sm md:text-base",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );

              return (
                <li key={item.href}>
                  {!isExpanded ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Footer indicator for collapsed state */}
      {!isExpanded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="h-1 w-6 rounded-full bg-muted" />
        </div>
      )}
    </aside>
  );
}