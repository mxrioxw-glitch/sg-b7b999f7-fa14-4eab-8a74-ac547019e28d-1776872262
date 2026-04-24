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
        cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isOccupied 
          ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-700' 
          : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-700'
        }
      `}
    >
      <div className="p-4 space-y-3">
        {/* Header: Número de Mesa y Zona */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-xl leading-tight">{table.table_number}</h3>
          {table.area && (
            <Badge variant="secondary" className="bg-white/25 text-white border-white/40 text-xs px-2 py-0.5 backdrop-blur-sm shrink-0">
              <MapPin className="h-3 w-3 mr-1" />
              {table.area}
            </Badge>
          )}
        </div>

        {/* Estado y Capacidad */}
        <div className="flex items-center gap-2">
          <Badge 
            className={`
              text-xs px-2.5 py-1
              ${isOccupied 
                ? 'bg-red-800/50 hover:bg-red-800/70 text-white border border-red-900/50 backdrop-blur-sm' 
                : 'bg-green-800/50 hover:bg-green-800/70 text-white border border-green-900/50 backdrop-blur-sm'
              }
            `}
          >
            {isOccupied ? "Ocupada" : "Disponible"}
          </Badge>
          
          <div className="flex items-center gap-1.5 text-sm font-semibold bg-white/20 rounded-full px-2.5 py-1 backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            <span>{table.capacity}</span>
          </div>
        </div>

        {/* Timer - Solo si está ocupada */}
        {isOccupied && order && (
          <div className="pt-2 border-t border-white/30">
            <div className="flex items-center justify-center gap-2 bg-black/20 rounded-lg p-2 backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              <span className="font-bold text-base font-mono tabular-nums tracking-wider">{elapsedTime || "00:00:00"}</span>
            </div>
          </div>
        )}

        {/* Info adicional si está disponible */}
        {!isOccupied && (
          <div className="pt-2 border-t border-white/30">
            <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
              <p className="text-sm font-semibold">Toca para abrir</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}