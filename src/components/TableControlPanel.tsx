import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Clock, Users, Plus, Minus, Trash2, Send, DollarSign, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tableService } from "@/services/tableService";

interface TableControlPanelProps {
  table: any;
  order: any;
  employees: any[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onOpenProductSelector: (callback: (products: any[]) => Promise<void>) => void;
  onProceedToCheckout: (order: any) => void;
}

export function TableControlPanel({
  table,
  order,
  employees,
  onClose,
  onRefresh,
  onOpenProductSelector,
  onProceedToCheckout,
}: TableControlPanelProps) {
  const { toast } = useToast();
  const [guestsCount, setGuestsCount] = useState(order?.guests_count || 1);
  const [selectedWaiter, setSelectedWaiter] = useState(order?.assigned_waiter_id || "");
  const [orderNotes, setOrderNotes] = useState(order?.notes || "");
  const [items, setItems] = useState<any[]>(order?.table_order_items || []);

  const pendingItems = items.filter(item => item.status === 'pending');

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

  useEffect(() => {
    setItems(order?.table_order_items || []);
    setGuestsCount(order?.guests_count || 1);
    setSelectedWaiter(order?.assigned_waiter_id || "");
    setOrderNotes(order?.notes || "");
  }, [order]);

  const handleUpdateQuantity = async (itemId: string, change: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    try {
      await tableService.updateOrderItem(itemId, { quantity: newQuantity });
      setItems(items.map(i => 
        i.id === itemId ? { ...i, quantity: newQuantity, total: i.unit_price * newQuantity } : i
      ));
      toast({ title: "✅ Cantidad actualizada" });
    } catch (error: any) {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await tableService.deleteOrderItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
      toast({ title: "✅ Producto eliminado" });
    } catch (error: any) {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSendToKitchen = async () => {
    try {
      const pendingIds = pendingItems.map(i => i.id);
      await tableService.sendItemsToKitchen(pendingIds);
      setItems(items.map(i => 
        pendingIds.includes(i.id) ? { ...i, status: 'sent_to_kitchen' } : i
      ));
      toast({ title: "✅ Enviado a cocina", description: `${pendingIds.length} items enviados` });
    } catch (error: any) {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePrintAccount = () => {
    toast({ title: "🖨️ Imprimiendo cuenta..." });
  };

  const handleAddProduct = () => {
    onOpenProductSelector(async (selectedProducts) => {
      // Esta lógica la maneja el ProductSelectorModal internamente si ya envía directo a BD,
      // pero requerimos refrescar la orden de la mesa
      await onRefresh();
    });
  };

  if (!table) return null;

  return (
    <Sheet open={!!table} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] max-w-[500px] p-0 flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-2xl">Mesa {table?.table_number}</SheetTitle>
              {table?.location && (
                <Badge variant="outline">{table.location}</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {order && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Abierta hace {getElapsedTime(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{guestsCount} {guestsCount === 1 ? "persona" : "personas"}</span>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {/* Mesero Asignado */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Mesero Asignado</label>
            <Select value={selectedWaiter} onValueChange={setSelectedWaiter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar mesero" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items de la Orden */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Items de la Orden</h3>
              <Button onClick={handleAddProduct} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                No hay productos en la orden
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.product_name}</h4>
                        {item.variant_name && (
                          <p className="text-xs text-muted-foreground">
                            {item.variant_name}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          item.status === "pending"
                            ? "secondary"
                            : item.status === "sent_to_kitchen"
                            ? "default"
                            : "outline"
                        }
                        className="ml-2 shrink-0"
                      >
                        {item.status === "pending"
                          ? "Pendiente"
                          : item.status === "sent_to_kitchen"
                          ? "En Cocina"
                          : "Servido"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">
                          ${(item.total || 0).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total + Footer - Always visible */}
        <div className="border-t bg-background flex-shrink-0">
          {items.length > 0 && (
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-accent">
                  ${items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="px-6 py-4 space-y-3">
            {/* Primera fila - Acciones secundarias */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleSendToKitchen}
                disabled={pendingItems.length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar a Cocina
                {pendingItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingItems.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handlePrintAccount}
                disabled={items.length === 0}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Cuenta
              </Button>
            </div>

            {/* Segunda fila - Acción principal */}
            <Button
              onClick={() => onProceedToCheckout(order)}
              disabled={items.length === 0}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-14 text-lg font-semibold"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Cobrar Mesa
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}