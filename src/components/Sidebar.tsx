import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  X,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { usePermissions } from "@/hooks/usePermissions";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [isHovering, setIsHovering] = useState(false);
  const [businessName, setBusinessName] = useState("Mi Negocio");
  const [userName, setUserName] = useState("");
  const { hasModuleAccess } = usePermissions(null);

  const menuItems = [
    { name: "Inicio", href: "/dashboard", icon: LayoutDashboard, permission: null },
    { name: "POS", href: "/pos", icon: ShoppingCart, permission: "sales" },
    { name: "Productos", href: "/products", icon: Package, permission: "products" },
    { name: "Inventario", href: "/inventory", icon: Warehouse, permission: "inventory" },
    { name: "Clientes", href: "/customers", icon: Users, permission: "customers" },
    { name: "Caja", href: "/cash-register", icon: DollarSign, permission: "cash_register" },
    { name: "Configuración", href: "/settings", icon: Settings, permission: "settings" },
  ];

  // Show all items for now - remove permission filtering
  const visibleItems = menuItems;

  // Auto-expand on hover
  useEffect(() => {
    if (isHovering) {
      setIsExpanded(true);
    } else {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isHovering]);

  useEffect(() => {
    loadBusinessInfo();
    loadUserInfo();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      const info = await businessService.getCurrentBusiness();
      if (info?.name) {
        setBusinessName(info.name);
      }
    } catch (error) {
      console.error("Error loading business info:", error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (session?.user?.email) {
        setUserName(session.user.email.split("@")[0]);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 280 : 80,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-semibold">{businessName}</h2>
                  <p className="text-xs text-muted-foreground">Sistema POS</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>

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

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <div className="space-y-1">
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
                          className="font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full",
                  isExpanded ? "justify-start gap-3" : "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      {userName}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
