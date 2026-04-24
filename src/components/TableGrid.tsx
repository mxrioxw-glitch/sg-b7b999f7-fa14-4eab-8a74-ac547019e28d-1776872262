import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, MapPin } from "lucide-react";
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
  const isOccupied = table.status === "occupied";
  const order = table.table_orders?.[0];

  useEffect(() => {
    if (!isOccupied || !order?.opened_at) {
      setElapsedTime("");
      return;
    }

    const updateTimer = () => {
      const start = new Date(order.opened_at);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const h = hours.toString().padStart(2, '0');
      const m = minutes.toString().padStart(2, '0');
      const s = seconds.toString().padStart(2, '0');
      
      setElapsedTime(`${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOccupied, order?.opened_at]);

  return (
    <Card
      onClick={onClick}
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isOccupied 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-600' 
          : 'bg-green-500 hover:bg-green-600 text-white border-green-600'
        }
      `}
    >
      <div className="p-4 space-y-3">
        {/* Header: Nombre y Zona */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{table.name}</h3>
            {table.area && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {table.area}
              </Badge>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={isOccupied ? "destructive" : "default"}
            className={`
              ${isOccupied 
                ? 'bg-red-700 hover:bg-red-800 text-white' 
                : 'bg-green-700 hover:bg-green-800 text-white'
              }
            `}
          >
            {isOccupied ? "Ocupada" : "Disponible"}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm font-medium">
            <Users className="h-4 w-4" />
            <span>{table.capacity}</span>
          </div>
        </div>

        {/* Timer - Solo si está ocupada */}
        {isOccupied && order && (
          <div className="pt-2 border-t border-white/20">
            <div className="flex items-center justify-center gap-2 text-sm font-mono">
              <Clock className="h-4 w-4" />
              <span className="font-semibold tabular-nums">{elapsedTime || "00:00:00"}</span>
            </div>
          </div>
        )}

        {/* Info adicional si está disponible */}
        {!isOccupied && (
          <div className="pt-2 border-t border-white/20">
            <p className="text-center text-sm font-medium opacity-90">
              Toca para abrir
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}