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
    if (table.status !== "occupied" || !table.current_order?.opened_at) {
      setElapsedTime("");
      return;
    }

    const updateTimer = () => {
      const openedAt = new Date(table.current_order.opened_at);
      const now = new Date();
      const diffMs = now.getTime() - openedAt.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setElapsedTime(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [table.status, table.current_order?.opened_at]);

  const getStatusColor = () => {
    switch (table.status) {
      case "available":
        return "border-accent bg-accent/10 hover:bg-accent/20";
      case "occupied":
        return "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "dirty":
        return "border-orange-500 bg-orange-50 hover:bg-orange-100";
      default:
        return "border-border hover:bg-muted/50";
    }
  };

  const getStatusLabel = () => {
    switch (table.status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "dirty":
        return "Sucia";
      default:
        return table.status;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${getStatusColor()} ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Table Info */}
        <div>
          <h3 className="font-bold text-lg">{table.name}</h3>
          {table.area && (
            <p className="text-sm opacity-90">{table.area}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            table.status === "available" 
              ? "bg-accent text-accent-foreground"
              : table.status === "occupied"
              ? "bg-white/20 text-white"
              : "bg-orange-200 text-orange-800"
          }`}>
            {getStatusLabel()}
          </span>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <Users className="h-3.5 w-3.5" />
            <span>{table.capacity}</span>
          </div>
        </div>

        {/* Timer for occupied tables */}
        {table.status === "occupied" && table.current_order && (
          <div className="pt-2 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono font-bold">{elapsedTime}</span>
              </div>
              {table.current_order.total && (
                <span className="font-bold">
                  ${Number(table.current_order.total || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}