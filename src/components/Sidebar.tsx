import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Settings,
  Store,
  X,
  Warehouse,
  TrendingUp,
} from "lucide-react";

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
    { name: "Inicio", href: "/", icon: LayoutDashboard, permission: null },
    { name: "Dashboard", href: "/dashboard", icon: TrendingUp, permission: null },
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
          "flex h-screen flex-col border-r bg-card transition-all duration-300",
          "fixed left-0 top-0 z-40 md:relative md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        {/* Logo Section - Always visible */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Store className="h-7 w-7 text-primary-foreground" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-lg font-semibold"
                >
                  {businessName}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-accent",
                    isActive && "bg-accent",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Icon className="h-7 w-7 flex-shrink-0" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap text-base font-medium"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
