import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserPlus, 
  Send, 
  Trash2, 
  Plus, 
  Minus,
  ShoppingCart,
  DollarSign,
  X,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tableService } from "@/services/tableService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableControlPanelProps {
  table: any;
  order: any;
  employees: any[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenProductSelector: (onSelect: (product: any) => void) => void;
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

  useEffect(() => {
    setItems(order?.table_order_items || []);
  }, [order]);

  const handleAddProduct = () => {
    onOpenProductSelector((product: any) => {
      addProductToOrder(product);
    });
  };

  const addProductToOrder = async (
    product: any, 
    variant?: any, 
    extras?: any[], 
    notes?: string, 
    quantity: number = 1
  ) => {
    if (!order) {
      toast({
        title: "❌ Error",
        description: "No hay una orden activa",
        variant: "destructive",
      });
      return;
    }

    try {
      const taxRate = 0.16; // 16% IVA
      
      const variantPrice = variant ? (variant.priceModifier ?? variant.price ?? 0) : 0;
      const extrasPrice = extras?.reduce((sum, e) => sum + (e.price || 0), 0) || 0;
      const basePrice = product.basePrice || product.base_price || product.price || 0;
      
      const unitPrice = basePrice + variantPrice + extrasPrice;
      const subtotal = unitPrice * quantity;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const newItem = {
        table_order_id: order.id,
        product_id: product.id,
        variant_id: variant?.id || null,
        product_name: product.name,
        variant_name: variant?.name || null,
        quantity,
        unit_price: unitPrice,
        subtotal,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        status: "pending",
      };

      await tableService.addItemToOrder(newItem);

      toast({
        title: "✅ Agregado a la orden",
        description: `${quantity}x ${product.name}`,
        className: "bg-accent text-accent-foreground",
      });

      // Refetch the order to update UI immediately
      const updatedOrder = await tableService.getTableOrder(table.id);
      setItems(updatedOrder.table_order_items || []);
      
      onRefresh();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo agregar el producto",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Number(item.quantity) + delta;
    if (newQuantity < 1) return;

    try {
      const subtotal = Number(item.unit_price) * newQuantity;
      const taxRate = 0.16;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      await tableService.updateOrderItem(itemId, {
        quantity: newQuantity,
        subtotal,
        tax_amount: taxAmount,
        total,
      });

      // Refetch the order to update UI immediately
      const updatedOrder = await tableService.getTableOrder(table.id);
      setItems(updatedOrder.table_order_items || []);

      onRefresh();
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await tableService.deleteOrderItem(itemId);
      
      toast({
        title: "✅ Item eliminado",
        description: "El producto fue removido de la orden",
        className: "bg-accent text-accent-foreground",
      });

      // Refetch the order to update UI immediately
      const updatedOrder = await tableService.getTableOrder(table.id);
      setItems(updatedOrder.table_order_items || []);

      onRefresh();
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el item",
        variant: "destructive",
      });
    }
  };

  const handleSendToKitchen = async () => {
    const pendingItems = items.filter(i => i.status === "pending");
    
    if (pendingItems.length === 0) {
      toast({
        title: "ℹ️ Sin items pendientes",
        description: "No hay productos para enviar a cocina",
      });
      return;
    }

    try {
      await tableService.sendItemsToKitchen(pendingItems.map(i => i.id));
      
      toast({
        title: "✅ Enviado a cocina",
        description: `${pendingItems.length} items enviados`,
        className: "bg-accent text-accent-foreground",
      });

      // Refetch the order to update UI immediately
      const updatedOrder = await tableService.getTableOrder(table.id);
      setItems(updatedOrder.table_order_items || []);

      onRefresh();
    } catch (error: any) {
      console.error("Error sending to kitchen:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo enviar a cocina",
        variant: "destructive",
      });
    }
  };

  const handleChangeWaiter = async (newWaiterId: string) => {
    if (!order) return;

    try {
      await tableService.changeWaiter(order.id, newWaiterId);
      setSelectedWaiter(newWaiterId);
      
      toast({
        title: "✅ Mesero actualizado",
        className: "bg-accent text-accent-foreground",
      });

      onRefresh();
    } catch (error: any) {
      console.error("Error changing waiter:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo cambiar el mesero",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-xs">Pendiente</Badge>;
      case "sent_to_kitchen":
        return <Badge className="text-xs bg-blue-500">En Cocina</Badge>;
      case "preparing":
        return <Badge className="text-xs bg-orange-500">Preparando</Badge>;
      case "ready":
        return <Badge className="text-xs bg-purple-500">Listo</Badge>;
      case "served":
        return <Badge className="text-xs bg-green-500">Servido</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const pendingItemsCount = items.filter(i => i.status === "pending").length;

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold">{table.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Abierta hace {formatElapsedTime(order?.opened_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{order?.guests_count || 0} personas</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Waiter Assignment */}
          {order && (
            <div className="space-y-2">
              <Label>Mesero Asignado</Label>
              <Select value={selectedWaiter} onValueChange={handleChangeWaiter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesero" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user?.full_name || emp.user?.email || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items de la Orden</h3>
              <Button size="sm" onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {items.length === 0 ? (
              <Card className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No hay productos en esta orden
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{item.product_name}</p>
                            {getStatusBadge(item.status)}
                          </div>
                          {item.variant_name && (
                            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">{item.notes}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                disabled={item.status !== "pending"}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                disabled={item.status !== "pending"}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-semibold">
                              ${(Number(item.total) || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {item.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      {order && items.length > 0 && (
        <div className="p-4 border-t space-y-3 bg-muted/20">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-2xl">${(Number(order.total) || 0).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleSendToKitchen}
              disabled={pendingItemsCount === 0}
              className="w-full"
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
              onClick={() => onProceedToCheckout(order)}
              className="w-full bg-accent hover:bg-accent/90"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Cobrar Mesa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}