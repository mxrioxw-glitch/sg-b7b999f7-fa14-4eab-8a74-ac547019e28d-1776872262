import { Card } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TableGridProps {
  tables: any[];
  onTableClick: (table: any) => void;
  selectedTableId?: string;
}

export function TableGrid({ tables, onTableClick, selectedTableId }: TableGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {tables.map((table) => (
        <TableCard 
          key={table.id} 
          table={table} 
          onClick={() => onTableClick(table)} 
          isSelected={selectedTableId === table.id}
        />
      ))}
    </div>
  );
}

function TableCard({ table, onClick, isSelected }: { table: any; onClick: () => void; isSelected?: boolean }) {
  const [elapsedTime, setElapsedTime] = useState("");

  useEffect(() => {
    if (table.status !== "occupied" || !table.active_order?.opened_at) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const openedAt = new Date(table.active_order.opened_at);
      const diffMs = now.getTime() - openedAt.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [table.status, table.active_order?.opened_at]);

  const getStatusColor = () => {
    switch (table.status) {
      case "available":
        return "bg-card hover:bg-accent/10 border-border";
      case "occupied":
        return "bg-red-500 hover:bg-red-600 border-red-600 text-white";
      case "dirty":
        return "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-white";
      default:
        return "bg-card hover:bg-accent/10 border-border";
    }
  };

  const getStatusText = () => {
    switch (table.status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "dirty":
        return "Sucia";
      default:
        return "Disponible";
    }
  };

  const order = table.active_order;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getStatusColor()}`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{table.name}</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            table.status === "available" 
              ? "bg-green-100 text-green-800" 
              : table.status === "occupied"
              ? "bg-white/20 text-white"
              : "bg-white/20 text-white"
          }`}>
            {getStatusText()}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>Capacidad: {table.capacity}</span>
        </div>

        {table.status === "occupied" && order && (
          <div className="space-y-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">{elapsedTime}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm opacity-90">
                {order.assigned_waiter?.user?.full_name || "Sin mesero"}
              </p>
              <p className="text-lg font-bold">
                ${Number(order.total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}