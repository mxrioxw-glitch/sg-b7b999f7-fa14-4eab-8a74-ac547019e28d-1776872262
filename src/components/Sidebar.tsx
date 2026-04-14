import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "Punto de Venta", path: "/pos" },
  { icon: Package, label: "Productos", path: "/products" },
  { icon: Warehouse, label: "Inventario", path: "/inventory" },
  { icon: Users, label: "Clientes", path: "/customers" },
  { icon: BarChart3, label: "Reportes", path: "/reports" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r border-border bg-card", className)}>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-accent/50",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-accent/30 p-3">
          <p className="text-xs font-semibold text-foreground">Plan Premium</p>
          <p className="mt-1 text-xs text-muted-foreground">23 días restantes</p>
          <Link href="/subscription">
            <button className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Gestionar Plan
            </button>
          </Link>
        </div>
      </div>
    </aside>
  );
}