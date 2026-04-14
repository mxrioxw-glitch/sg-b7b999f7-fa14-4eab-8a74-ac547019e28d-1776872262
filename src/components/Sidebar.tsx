import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, ShoppingCart, Package, Users, DollarSign, Settings, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    }
  }, []);

  // Save state to localStorage
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("sidebar-expanded", String(newState));
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
        "relative bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-[70px]"
      )}
    >
      {/* Header with logo and toggle */}
      <div className="relative p-6 border-b border-border flex items-center justify-between">
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

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute transition-all duration-300",
            isExpanded ? "right-2" : "right-1/2 translate-x-1/2"
          )}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    active 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted",
                    !isExpanded && "justify-center px-2"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    active && "drop-shadow-sm"
                  )} />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );

              return (
                <li key={item.href}>
                  {isExpanded ? (
                    linkContent
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Footer indicator */}
      <div className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-200",
        isExpanded ? "opacity-0" : "opacity-100"
      )}>
        <div className="h-1 w-8 rounded-full bg-muted" />
      </div>
    </aside>
  );
}