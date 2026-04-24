import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Users,
  Check,
  X,
  Calculator,
  Banknote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tableService } from "@/services/tableService";
import { saleService } from "@/services/saleService";
import { businessService } from "@/services/businessService";
import { authService } from "@/services/authService";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tableOrder: any;
  table: any;
  paymentMethods?: any[];
}

export function CheckoutModal({ isOpen, onClose, onComplete, tableOrder, table, paymentMethods = [] }: CheckoutModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<"full" | "equal" | "items">("full");
  const [splitCount, setSplitCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const items = tableOrder?.table_order_items || [];
  const subtotal = Number(tableOrder?.subtotal || 0);
  const taxAmount = Number(tableOrder?.tax_amount || 0);
  const total = Number(tableOrder?.total || 0);

  const splitAmount = splitMode === "equal" 
    ? total / splitCount
    : splitMode === "items"
    ? items
        .filter((item: any) => selectedItems.includes(item.id))
        .reduce((sum: number, item: any) => sum + Number(item.total), 0)
    : total;

  const change = paymentMethod === "cash" && cashReceived
    ? Math.max(0, Number(cashReceived) - splitAmount)
    : 0;

  function toggleItemSelection(itemId: string) {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }

  async function handleCheckout() {
    if (paymentMethod === "cash" && Number(cashReceived) < splitAmount) {
      toast({
        title: "❌ Efectivo insuficiente",
        description: `Se requieren $${splitAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) throw new Error("No session");

      const business = await businessService.getCurrentBusiness();
      if (!business) throw new Error("Business not found");

      // Preparar datos de la venta
      const saleData = {
        business_id: business.id,
        employee_id: tableOrder.assigned_waiter_id,
        customer_id: tableOrder.customer_id || null,
        payment_method: paymentMethod,
        subtotal: splitMode === "full" ? subtotal : splitAmount / 1.16,
        tax_amount: splitMode === "full" ? taxAmount : splitAmount - (splitAmount / 1.16),
        discount_amount: 0,
        total: splitAmount,
        status: "completed",
        notes: `Mesa ${table.table_number} - ${splitMode === "equal" ? `${splitCount} partes` : splitMode === "items" ? "Items seleccionados" : "Total"}`,
      };

      // Cerrar mesa y crear venta
      await tableService.closeTable(table.id, tableOrder.id, saleData);

      toast({
        title: "✅ Cobro exitoso",
        description: `Mesa ${table.table_number} cobrada y liberada`,
        className: "bg-accent text-accent-foreground",
      });

      onComplete();
    } catch (error: any) {
      console.error("Error processing checkout:", error);
      toast({
        title: "❌ Error al cobrar",
        description: error.message || "No se pudo procesar el cobro",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const getPaymentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("efectivo")) return <DollarSign className="h-6 w-6" />;
    if (n.includes("tarjeta") || n.includes("débito") || n.includes("crédito")) return <CreditCard className="h-6 w-6" />;
    if (n.includes("transferencia")) return <Banknote className="h-6 w-6" />;
    return <Wallet className="h-6 w-6" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">
            Cobrar Mesa {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Split Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Cobro</Label>
              <RadioGroup value={splitMode} onValueChange={(v: any) => setSplitMode(v)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    Cuenta Completa
                  </Label>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="equal" id="equal" />
                  <Label htmlFor="equal" className="flex-1 cursor-pointer">
                    Dividir en Partes Iguales
                  </Label>
                  {splitMode === "equal" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={2}
                        value={splitCount}
                        onChange={(e) => setSplitCount(Number(e.target.value))}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-muted-foreground">
                        = ${splitAmount.toFixed(2)} c/u
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="items" id="items" />
                  <Label htmlFor="items" className="flex-1 cursor-pointer">
                    Seleccionar Items
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Item Selection */}
            {splitMode === "items" && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Seleccionar Items a Cobrar</Label>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        selectedItems.includes(item.id)
                          ? "ring-2 ring-accent bg-accent/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                          selectedItems.includes(item.id)
                            ? "bg-accent border-accent"
                            : "border-muted-foreground"
                        }`}>
                          {selectedItems.includes(item.id) && (
                            <Check className="h-3 w-3 text-accent-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                          <p className="font-semibold">${Number(item.total).toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold">Método de Pago</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      type="button"
                      variant={paymentMethod === method.name ? "default" : "outline"}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setPaymentMethod(method.name)}
                    >
                      <span className="text-muted-foreground group-hover:text-current">
                        {getPaymentIcon(method.name)}
                      </span>
                      <span className="text-xs text-center leading-tight whitespace-normal h-8 flex items-center justify-center">
                        {method.name}
                      </span>
                    </Button>
                  ))
                ) : (
                  // Fallback hardcoded methods if none provided
                  ["Efectivo", "Tarjeta de Crédito", "Tarjeta de Débito", "Transferencia"].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "default" : "outline"}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setPaymentMethod(method)}
                    >
                      <span className="text-muted-foreground group-hover:text-current">
                        {getPaymentIcon(method)}
                      </span>
                      <span className="text-xs text-center leading-tight whitespace-normal h-8 flex items-center justify-center">
                        {method}
                      </span>
                    </Button>
                  ))
                )}
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label>Efectivo Recibido</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-lg"
                />
                {change > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Cambio: <span className="font-bold text-accent">${change.toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-4 border-t space-y-4">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Total a Cobrar:</span>
            <span className="text-2xl text-accent">${splitAmount.toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Confirmar Cobro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}