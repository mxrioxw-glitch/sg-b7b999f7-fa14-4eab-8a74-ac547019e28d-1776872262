import Link from "next/link";
import { Home, ShoppingCart, Package, Users, DollarSign, Settings, BarChart3 } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/pos", icon: ShoppingCart, label: "Punto de Venta" },
    { href: "/products", icon: Package, label: "Productos" },
    { href: "/inventory", icon: Package, label: "Inventario" },
    { href: "/customers", icon: Users, label: "Clientes" },
    { href: "/cash-register", icon: DollarSign, label: "Corte de Caja" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">POS SaaS</h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}