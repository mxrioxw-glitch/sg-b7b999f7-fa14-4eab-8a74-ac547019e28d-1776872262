import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableGridProps {
  tables: any[];
  onTableClick: (table: any) => void;
  selectedTableId?: string;
}

export function TableGrid({ tables, onTableClick, selectedTableId }: TableGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 border-green-500 text-green-700";
      case "occupied":
        return "bg-accent/20 border-accent text-accent-foreground";
      case "dirty":
        return "bg-orange-500/10 border-orange-500 text-orange-700";
      case "reserved":
        return "bg-blue-500/10 border-blue-500 text-blue-700";
      default:
        return "bg-muted/20 border-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Libre";
      case "occupied":
        return "Ocupada";
      case "dirty":
        return "Sucia";
      case "reserved":
        return "Reservada";
      default:
        return status;
    }
  };

  const getElapsedTime = (openedAt: string) => {
    const start = new Date(openedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {tables.map((table) => {
        const order = table.table_orders?.[0];
        const isSelected = selectedTableId === table.id;

        return (
          <Card
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              "relative cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
              getStatusColor(table.status),
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <div className="p-4 space-y-3">
              {/* Número de Mesa */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mesa</p>
                  <p className="text-2xl font-bold font-heading">{table.table_number}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getStatusLabel(table.status)}
                </Badge>
              </div>

              {/* Información de Mesa Ocupada */}
              {table.status === "occupied" && order && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Tiempo transcurrido */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">
                      {getElapsedTime(order.opened_at)}
                    </span>
                  </div>

                  {/* Mesero asignado */}
                  {order.employees && (
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">
                        {order.employees.full_name}
                      </span>
                    </div>
                  )}

                  {/* Comensales */}
                  {order.guests_count && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{order.guests_count} personas</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {order.assigned_waiter?.user?.full_name || "Sin mesero"}
                    </p>
                    <p className="text-sm font-bold">
                      ${Number(order.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Capacidad para mesa libre */}
              {table.status === "available" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Users className="h-3 w-3" />
                  <span>Capacidad: {table.capacity} personas</span>
                </div>
              )}

              {/* Área */}
              {table.area && (
                <div className="text-xs text-muted-foreground truncate">
                  {table.area}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}