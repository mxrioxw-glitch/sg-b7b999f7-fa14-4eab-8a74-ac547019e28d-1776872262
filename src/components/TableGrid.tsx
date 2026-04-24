import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableGridProps {
  tables: any[];
  onTableClick: (table: any) => void;
  selectedTableId?: string | null;
}

export function TableGrid({ tables, onTableClick, selectedTableId }: TableGridProps) {
  const getTableStatus = (table: any) => {
    // Verificar si hay una orden activa (status = 'open')
    const hasActiveOrder = table.table_orders?.[0]?.status === "open";
    
    // Si la mesa está marcada como ocupada O tiene una orden activa
    if (table.status === "occupied" || hasActiveOrder) return "occupied";
    
    // Si está marcada como sucia
    if (table.status === "dirty") return "dirty";
    
    // Por defecto, disponible
    return "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent-foreground";
      case "occupied":
        return "bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive-foreground";
      case "dirty":
        return "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-700";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "dirty":
        return "Sucia";
      default:
        return "";
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
      {tables.map((table) => {
        const status = getTableStatus(table);
        const order = table.table_orders?.[0];

        return (
          <button
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              "relative border-2 rounded-xl p-6 transition-all min-h-[140px]",
              "flex flex-col items-center justify-center gap-3",
              getStatusColor(status)
            )}
          >
            {/* Table Number */}
            <div className="text-3xl font-bold">
              Mesa {table.table_number}
            </div>

            {/* Status Badge */}
            <Badge
              variant={status === "available" ? "default" : "secondary"}
              className="text-sm"
            >
              {getStatusLabel(status)}
            </Badge>

            {/* Table Info */}
            {status === "occupied" && order && (
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{getElapsedTime(order.created_at)}</span>
                </div>
                {order.guests_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{order.guests_count}</span>
                  </div>
                )}
              </div>
            )}

            {/* Location Badge */}
            {table.location && (
              <Badge
                variant="outline"
                className="absolute top-2 right-2 text-xs"
              >
                {table.location}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}