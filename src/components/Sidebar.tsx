import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { businessService } from "@/services/businessService";
import { Badge } from "@/components/ui/badge";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [business, setBusiness] = useState<Business | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Check if super admin
        const SUPER_ADMIN_EMAIL = "mxrioxw@gmail.com";
        setIsSuperAdmin(user.email === SUPER_ADMIN_EMAIL);

        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else {
          setUserName(user.email?.split("@")[0] || "Usuario");
        }

        // Get business data (if not super admin)
        if (user.email !== SUPER_ADMIN_EMAIL) {
          const currentBusiness = await businessService.getCurrentBusiness();
          setBusiness(currentBusiness);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  const menuItems = [
    { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Productos", href: "/products", icon: Package },
    { name: "Inventario", href: "/inventory", icon: Warehouse },
    { name: "Clientes", href: "/customers", icon: Users },
    { name: "Corte de Caja", href: "/cash-register", icon: DollarSign },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
    { name: "Configuración", href: "/settings", icon: Settings },
  ];

  const superAdminItems = [
    { name: "Super Admin", href: "/super-admin", icon: LayoutDashboard },
  ];

  const visibleItems = isSuperAdmin ? superAdminItems : menuItems;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function getUserInitials(name: string, email: string): string {
    if (name && name !== email.split("@")[0]) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  }

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
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 280 : 80,
          x: isOpen ? 0 : -280,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-full bg-card border-r border-border z-50",
          "md:relative md:translate-x-0 flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">
                    {business?.pos_name || "Mi POS"}
                  </h1>
                  {business && (
                    <p className="text-xs text-muted-foreground">
                      {business.name}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:flex"
          >
            {isExpanded ? (
              <ChevronLeft className="h-7 w-7" />
            ) : (
              <ChevronRight className="h-7 w-7" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence mode="wait">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 transition-colors cursor-pointer",
                      isExpanded ? "gap-3" : "justify-center",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-7 w-7 flex-shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              );
            })}
          </AnimatePresence>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full",
                  isExpanded ? "justify-start gap-3" : "justify-center p-2"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getUserInitials(userName, userEmail)}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 text-left overflow-hidden"
                    >
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {userEmail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-7 w-7" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/subscription")}>
                <Store className="mr-2 h-7 w-7" />
                Suscripción
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-7 w-7" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </>
  );
}