import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInventoryItem,
  updateInventoryItem,
} from "@/services/inventoryService";
import { getCurrentBusiness } from "@/services/businessService";
import type { InventoryItem } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";

interface InventoryFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

export function InventoryForm({ item, onClose }: InventoryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(item?.name || "");
  const [unit, setUnit] = useState(item?.unit || "kg");
  const [currentStock, setCurrentStock] = useState(
    item?.current_stock ? Number(item.current_stock) : 0
  );
  const [minStock, setMinStock] = useState(
    item?.min_stock ? Number(item.min_stock) : 0
  );
  const [costPerUnit, setCostPerUnit] = useState(
    item?.cost_per_unit ? Number(item.cost_per_unit) : 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const business = await getCurrentBusiness();
      if (!business) throw new Error("No business found");

      const itemData = {
        name,
        unit,
        current_stock: currentStock,
        min_stock: minStock,
        cost_per_unit: costPerUnit,
      };

      if (item) {
        await updateInventoryItem(item.id, itemData);
        toast({
          title: "Insumo actualizado",
          description: "El insumo se actualizó correctamente",
        });
      } else {
        await createInventoryItem({
          ...itemData,
          business_id: business.id,
        });
        toast({
          title: "Insumo creado",
          description: "El insumo se creó correctamente",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el insumo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Insumo *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ej: Café en grano, Leche"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad de medida *</Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            placeholder="Ej: kg, litros, pzas"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Costo por unidad *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current_stock">Stock Actual *</Label>
          <Input
            id="current_stock"
            type="number"
            step="0.01"
            min="0"
            value={currentStock}
            onChange={(e) => setCurrentStock(Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_stock">Stock Mínimo (Alerta) *</Label>
          <Input
            id="min_stock"
            type="number"
            step="0.01"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Insumo"}
        </Button>
      </div>
    </form>
  );
}