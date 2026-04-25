import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Clock, Users, Send, Printer, DollarSign, Edit2, Trash2, Plus, Minus } from "lucide-react";
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
  const [showChangeWaiter, setShowChangeWaiter] = useState(false);
  const [newWaiterId, setNewWaiterId] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  if (!table) return null;

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const handleChangeWaiter = async () => {
    if (!newWaiterId || !order) return;

    try {
      await tableService.changeWaiter(order.id, newWaiterId);
      
      toast({
        title: "✅ Mesero actualizado",
        description: "El mesero ha sido cambiado exitosamente",
        className: "bg-accent text-accent-foreground",
      });
      
      setShowChangeWaiter(false);
      await onRefresh();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo cambiar el mesero",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await tableService.deleteOrderItem(itemId);
      
      toast({
        title: "✅ Producto eliminado",
        description: "El producto ha sido eliminado de la orden",
        className: "bg-accent text-accent-foreground",
      });
      
      await onRefresh();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, delta: number) => {
    const item = order?.table_order_items?.find((i: any) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      await handleDeleteItem(itemId);
      return;
    }

    try {
      const newSubtotal = item.unit_price * newQuantity;
      const newTaxAmount = newSubtotal * 0.16;
      const newTotal = newSubtotal + newTaxAmount;

      await tableService.updateOrderItem(itemId, {
        quantity: newQuantity,
        subtotal: Number(newSubtotal.toFixed(2)),
        tax_amount: Number(newTaxAmount.toFixed(2)),
        total: Number(newTotal.toFixed(2)),
      });

      await onRefresh();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  const handleSendToKitchen = async () => {
    if (!order?.table_order_items) return;

    const pendingItems = order.table_order_items
      .filter((item: any) => item.status === "pending")
      .map((item: any) => item.id);

    if (pendingItems.length === 0) {
      toast({
        title: "ℹ️ Sin items pendientes",
        description: "No hay productos pendientes para enviar a cocina",
      });
      return;
    }

    try {
      await tableService.sendItemsToKitchen(pendingItems);
      
      toast({
        title: "✅ Enviado a cocina",
        description: `${pendingItems.length} ${pendingItems.length === 1 ? 'producto enviado' : 'productos enviados'} a cocina`,
        className: "bg-accent text-accent-foreground",
      });
      
      await onRefresh();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo enviar a cocina",
        variant: "destructive",
      });
    }
  };

  const pendingItemsCount = order?.table_order_items?.filter((item: any) => item.status === "pending").length || 0;
  const currentWaiter = employees.find(e => e.id === order?.assigned_waiter_id);

  return (
    <Sheet open={!!table} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] max-w-[500px] p-0 flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <VisuallyHidden>
            <SheetTitle>Mesa {table?.table_number}</SheetTitle>
          </VisuallyHidden>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Mesa {table?.table_number}</h2>
              {table?.area && (
                <Badge variant="outline">
                  {table.area}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
            {order && (
              <>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Abierta hace {formatTimeAgo(new Date(order.opened_at))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{order.guests_count} {order.guests_count === 1 ? 'persona' : 'personas'}</span>
                </div>
              </>
            )}
          </div>
        </SheetHeader>

        {/* Mesero Asignado */}
        <div className="px-6 py-3 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Mesero Asignado</p>
              <p className="font-medium">
                {currentWaiter?.profiles?.full_name || currentWaiter?.profiles?.email || "Sin asignar"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewWaiterId(order?.assigned_waiter_id || "");
                setShowChangeWaiter(true);
              }}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Cambiar
            </Button>
          </div>
        </div>

        {/* Items de la Orden */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Items de la Orden</h3>
            <Button
              onClick={() => onOpenProductSelector(async () => await onRefresh())}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>

          {!order?.table_order_items || order.table_order_items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay productos en la orden</p>
              <p className="text-sm mt-2">Haz click en "Agregar Producto" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {order.table_order_items.map((item: any) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        item.status === "pending" ? "secondary" :
                        item.status === "sent_to_kitchen" ? "default" :
                        "outline"
                      }
                    >
                      {item.status === "pending" ? "Pendiente" :
                       item.status === "sent_to_kitchen" ? "En Cocina" :
                       "Servido"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={item.status !== "pending"}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        disabled={item.status !== "pending"}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${Number(item.total).toFixed(2)}</span>
                      {item.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con Total y Acciones */}
        {order && (
          <div className="border-t p-6 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-accent">${Number(order.total || 0).toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleSendToKitchen}
                disabled={pendingItemsCount === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar a Cocina
                {pendingItemsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingItemsCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {/* TODO: Implement print */}}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Cuenta
              </Button>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => onProceedToCheckout(order)}
              disabled={!order.table_order_items || order.table_order_items.length === 0}
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Cobrar Mesa
            </Button>
          </div>
        )}

        {/* Change Waiter Dialog */}
        <Dialog open={showChangeWaiter} onOpenChange={setShowChangeWaiter}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Mesero</DialogTitle>
              <DialogDescription>
                Selecciona el nuevo mesero para esta mesa
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={newWaiterId} onValueChange={setNewWaiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesero" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.profiles?.full_name || emp.profiles?.email || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangeWaiter(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangeWaiter}>
                Confirmar Cambio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}