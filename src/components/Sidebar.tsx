import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  DollarSign,
  Settings,
  Box,
  Receipt,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { href: "/pos", icon: ShoppingCart, label: "Ventas", badge: null },
  { href: "/products", icon: Package, label: "Productos", badge: null },
  { href: "/inventory", icon: Box, label: "Inventario", badge: "3" },
  { href: "/customers", icon: Users, label: "Clientes", badge: null },
  { href: "/cash-register", icon: DollarSign, label: "Corte de Caja", badge: null },
  { href: "/reports", icon: BarChart3, label: "Reportes", badge: null },
  { href: "/settings", icon: Settings, label: "Configuración", badge: null },
];

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r border-border bg-card", className)}>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-accent/50",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
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