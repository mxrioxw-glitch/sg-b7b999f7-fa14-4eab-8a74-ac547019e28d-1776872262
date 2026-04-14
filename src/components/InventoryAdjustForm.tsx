import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustInventoryStock } from "@/services/inventoryService";
import type { InventoryItem } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";

interface InventoryAdjustFormProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export function InventoryAdjustForm({ item, onClose }: InventoryAdjustFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    if (type === "out" && quantity > Number(item.current_stock)) {
      toast({
        title: "Error",
        description: "No hay suficiente stock para esta salida",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await adjustInventoryStock(item.id, quantity, type);
      toast({
        title: "Stock ajustado",
        description: "El inventario se actualizó correctamente",
      });
      onClose();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast({
        title: "Error",
        description: "No se pudo ajustar el stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-4 rounded-lg mb-4">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          Stock actual: {Number(item.current_stock).toFixed(2)} {item.unit}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Movimiento</Label>
        <Select value={type} onValueChange={(v: "in" | "out") => setType(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in">Entrada (+)</SelectItem>
            <SelectItem value="out">Salida (-)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad ({item.unit}) *</Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          min="0.01"
          value={quantity || ""}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (Opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Motivo del ajuste..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Confirmar Ajuste"}
        </Button>
      </div>
    </form>
  );
}