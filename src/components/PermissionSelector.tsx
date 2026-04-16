import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Warehouse, Users, CreditCard, BarChart3, Settings, UserCog } from "lucide-react";

interface Permission {
  module: string;
  can_read: boolean;
  can_write: boolean;
}

interface PermissionSelectorProps {
  permissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

const MODULES = [
  {
    id: "pos",
    name: "Punto de Venta",
    description: "Realizar ventas y cobros",
    icon: ShoppingCart,
    color: "text-green-600",
  },
  {
    id: "products",
    name: "Productos",
    description: "Gestionar catálogo de productos",
    icon: Package,
    color: "text-blue-600",
  },
  {
    id: "inventory",
    name: "Inventario",
    description: "Control de stock e insumos",
    icon: Warehouse,
    color: "text-purple-600",
  },
  {
    id: "customers",
    name: "Clientes",
    description: "Gestión de clientes",
    icon: Users,
    color: "text-pink-600",
  },
  {
    id: "cash_register",
    name: "Corte de Caja",
    description: "Abrir/cerrar turnos",
    icon: CreditCard,
    color: "text-yellow-600",
  },
  {
    id: "reports",
    name: "Reportes",
    description: "Ver dashboard y estadísticas",
    icon: BarChart3,
    color: "text-indigo-600",
  },
  {
    id: "settings",
    name: "Configuración",
    description: "Ajustes del negocio",
    icon: Settings,
    color: "text-gray-600",
  },
  {
    id: "employees",
    name: "Empleados",
    description: "Gestionar equipo",
    icon: UserCog,
    color: "text-red-600",
  },
];

export function PermissionSelector({ permissions, onChange, disabled }: PermissionSelectorProps) {
  const [localPermissions, setLocalPermissions] = useState<Permission[]>(permissions);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  const handleToggle = (moduleId: string, type: "can_read" | "can_write") => {
    const updated = [...localPermissions];
    const existing = updated.find((p) => p.module === moduleId);

    if (existing) {
      existing[type] = !existing[type];
      // Si se desactiva write, también desactivar read
      if (type === "can_read" && !existing.can_read) {
        existing.can_write = false;
      }
      // Si se activa write, también activar read
      if (type === "can_write" && existing.can_write) {
        existing.can_read = true;
      }
    } else {
      updated.push({
        module: moduleId,
        can_read: type === "can_read" || type === "can_write",
        can_write: type === "can_write",
      });
    }

    setLocalPermissions(updated);
    onChange(updated);
  };

  const getPermission = (moduleId: string) => {
    return localPermissions.find((p) => p.module === moduleId) || { module: moduleId, can_read: false, can_write: false };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos del Empleado</CardTitle>
        <CardDescription>
          Selecciona los módulos a los que este empleado tendrá acceso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const permission = getPermission(module.id);

          return (
            <div
              key={module.id}
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Icon className={`h-5 w-5 mt-0.5 ${module.color}`} />
              <div className="flex-1 space-y-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{module.name}</h4>
                    {permission.can_read && (
                      <Badge variant="outline" className="text-xs">
                        {permission.can_write ? "Lectura y Escritura" : "Solo Lectura"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.id}-read`}
                      checked={permission.can_read}
                      onCheckedChange={() => handleToggle(module.id, "can_read")}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`${module.id}-read`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Ver
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.id}-write`}
                      checked={permission.can_write}
                      onCheckedChange={() => handleToggle(module.id, "can_write")}
                      disabled={disabled || !permission.can_read}
                    />
                    <Label
                      htmlFor={`${module.id}-write`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Editar
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}