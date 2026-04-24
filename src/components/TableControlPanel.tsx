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
  CheckCircle2,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tableService } from "@/services/tableService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

// Helper function to format elapsed time
function formatElapsedTime(dateString?: string) {
  if (!dateString) return "0m";
  
  const start = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface TableControlPanelProps {
  table: any;
  order: any;
  employees: any[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenProductSelector: (onSelect: (products: any[]) => Promise<void>) => void;
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
    onOpenProductSelector(async (products: any[]) => {
      await addProductsToOrderBatch(products);
    });
  };

  const addProductsToOrderBatch = async (products: any[]) => {
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
      
      const newItems = products.map(item => {
        const { product, variant, extras, notes, quantity } = item;
        
        // Fix: usar displayPrice que ya viene calculado correctamente
        const unitPrice = item.displayPrice;
        const subtotal = unitPrice * quantity;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;

        return {
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
      });

      // Insertamos todos los items en batch
      for (const item of newItems) {
         await tableService.addItemToOrder(item);
      }

      toast({
        title: "✅ Productos guardados",
        description: `${products.length} productos agregados a la orden`,
        className: "bg-accent text-accent-foreground",
      });

      // Refetch the order to update UI immediately
      const updatedOrder = await tableService.getTableOrder(table.id);
      setItems(updatedOrder.table_order_items || []);
      
      onRefresh();
    } catch (error: any) {
      console.error("Error adding products:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudieron agregar los productos",
        variant: "destructive",
      });
      throw error; // Rethrow to be caught by the modal
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

  const handlePrintAccount = () => {
    if (!order || items.length === 0) {
      toast({
        title: "⚠️ Sin items",
        description: "No hay productos para imprimir",
        variant: "destructive",
      });
      return;
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxTotal = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);

    // Crear contenido del ticket
    const ticketContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cuenta - Mesa ${table.table_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 10mm;
            font-size: 12pt;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header h1 { font-size: 18pt; margin-bottom: 5px; }
          .header p { font-size: 10pt; }
          .info { margin-bottom: 15px; font-size: 10pt; }
          .items { margin-bottom: 15px; }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11pt;
          }
          .item-name { flex: 1; }
          .item-details {
            font-size: 9pt;
            color: #666;
            margin-left: 10px;
            margin-top: 2px;
          }
          .item-price { 
            white-space: nowrap;
            margin-left: 10px;
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .totals {
            font-size: 11pt;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .total-row.final {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #000;
            font-size: 10pt;
          }
          @media print {
            body { width: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CUENTA</h1>
          <p>${new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="info">
          <p><strong>Mesa:</strong> ${table.table_number}</p>
          <p><strong>Personas:</strong> ${order.guests_count || 0}</p>
          ${order.assigned_waiter_name ? `<p><strong>Mesero:</strong> ${order.assigned_waiter_name}</p>` : ''}
        </div>

        <div class="divider"></div>

        <div class="items">
          ${items.map(item => `
            <div class="item">
              <div style="flex: 1;">
                <div class="item-name">
                  ${item.quantity}x ${item.product_name}
                  ${item.variant_name ? ` (${item.variant_name})` : ''}
                </div>
                ${item.notes ? `<div class="item-details">• ${item.notes}</div>` : ''}
              </div>
              <div class="item-price">$${(item.total || 0).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>IVA (16%):</span>
            <span>$${taxTotal.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        ${order.notes ? `
          <div class="divider"></div>
          <div style="margin-top: 10px; font-size: 10pt;">
            <strong>Notas:</strong> ${order.notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>¡Gracias por su preferencia!</p>
          <p style="margin-top: 5px; font-size: 9pt;">Esta no es una factura fiscal</p>
        </div>
      </body>
      </html>
    `;

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-print cuando cargue
      printWindow.onload = () => {
        printWindow.print();
      };

      toast({
        title: "🖨️ Imprimiendo cuenta",
        description: "Se abrió la ventana de impresión",
        className: "bg-accent text-accent-foreground",
      });
    } else {
      toast({
        title: "❌ Error",
        description: "No se pudo abrir la ventana de impresión. Verifica los permisos de pop-ups.",
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{table.table_number}</h2>
              {table.area && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {table.area}
                </span>
              )}
            </div>
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
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors">
          <X className="h-4 w-4" />
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
      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          onClick={handleSendToKitchen}
          disabled={pendingItemsCount === 0}
          className="flex-1"
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
          onClick={handlePrintAccount}
          disabled={items.length === 0}
          className="flex-1"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Cuenta
        </Button>

        <Button
          onClick={() => onProceedToCheckout(order)}
          disabled={items.length === 0}
          size="lg"
          className="flex-1"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Cobrar Mesa
        </Button>
      </div>
    </div>
  );
}