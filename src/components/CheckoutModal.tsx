import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, CreditCard, Wallet, Banknote, Receipt, TrendingUp, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tableService } from "@/services/tableService";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tableOrder: any;
  table: any;
  paymentMethods?: any[];
}

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  tableOrder, 
  table, 
  paymentMethods = [] 
}: CheckoutModalProps) {
  const { toast } = useToast();
  const [splitType, setSplitType] = useState("full");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customTip, setCustomTip] = useState("");
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const order = tableOrder;

  useEffect(() => {
    if (isOpen && paymentMethods.length > 0) {
      setPaymentMethod(paymentMethods[0]?.name || "Efectivo");
    }
  }, [isOpen, paymentMethods]);

  useEffect(() => {
    if (selectedTipPercentage !== null) {
      setCustomTip("");
    }
  }, [selectedTipPercentage]);

  useEffect(() => {
    if (customTip) {
      setSelectedTipPercentage(null);
    }
  }, [customTip]);

  if (!order) return null;

  const items = order.table_order_items || [];
  const orderSubtotal = Number(order.subtotal || 0);
  const orderTax = Number(order.tax || 0);
  const orderTotal = Number(order.total || 0);

  // Calcular propina
  const calculateTip = () => {
    if (customTip) {
      return Number(customTip) || 0;
    }
    if (selectedTipPercentage !== null) {
      return orderSubtotal * (selectedTipPercentage / 100);
    }
    return 0;
  };

  const tipAmount = calculateTip();
  const finalTotal = orderTotal + tipAmount;

  // Calcular total para división
  const calculateSplitTotal = () => {
    if (splitType === "full") {
      return finalTotal;
    }
    if (splitType === "equal") {
      const people = 2; // Podría ser configurable
      return finalTotal / people;
    }
    if (splitType === "items") {
      const selectedTotal = items
        .filter((item: any) => selectedItems.includes(item.id))
        .reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);
      return selectedTotal;
    }
    return 0;
  };

  const handleTipSelect = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setCustomTip("");
  };

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast({
        title: "❌ Método de pago requerido",
        description: "Selecciona un método de pago",
        variant: "destructive",
      });
      return;
    }

    if (splitType === "items" && selectedItems.length === 0) {
      toast({
        title: "❌ Selecciona items",
        description: "Debes seleccionar al menos un item",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const amountToCharge = calculateSplitTotal();

      if (splitType === "full") {
        // Cobrar completo y cerrar mesa
        await tableService.closeTable(table.id, order.id, {
          business_id: table.business_id,
          subtotal: orderSubtotal,
          tax_amount: orderTax,
          total_amount: finalTotal,
          payment_method: paymentMethod,
          status: "completed"
        });

        toast({
          title: "✅ Cobro exitoso",
          description: `Mesa ${table.table_number} cerrada - Total: $${finalTotal.toFixed(2)}`,
          className: "bg-accent text-accent-foreground",
        });

        onComplete();
      } else {
        // Cobro parcial
        toast({
          title: "✅ Cobro parcial",
          description: `Cobrado: $${amountToCharge.toFixed(2)}`,
          className: "bg-accent text-accent-foreground",
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Error processing checkout:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo procesar el cobro",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("efectivo")) return <DollarSign className="h-5 w-5" />;
    if (n.includes("tarjeta") || n.includes("débito") || n.includes("crédito")) return <CreditCard className="h-5 w-5" />;
    if (n.includes("transferencia")) return <Banknote className="h-5 w-5" />;
    return <Wallet className="h-5 w-5" />;
  };

  const tipOptions = [
    { label: "10%", value: 10 },
    { label: "15%", value: 15 },
    { label: "20%", value: 20 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">
            Cobrar {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Resumen de la cuenta */}
            <Card className="bg-muted/30 border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Receipt className="h-4 w-4" />
                  <span>Resumen de la cuenta</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">${orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA (16%)</span>
                    <span className="font-medium">${orderTax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total sin propina</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Propinas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Propina (opcional)</h3>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {tipOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedTipPercentage === option.value ? "default" : "outline"}
                    className={cn(
                      "h-auto py-4 flex flex-col items-center gap-2 transition-all",
                      selectedTipPercentage === option.value && "ring-2 ring-accent ring-offset-2"
                    )}
                    onClick={() => handleTipSelect(option.value)}
                  >
                    {selectedTipPercentage === option.value && (
                      <Check className="h-4 w-4 absolute top-1 right-1" />
                    )}
                    <span className="text-lg font-bold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ${(orderSubtotal * (option.value / 100)).toFixed(2)}
                    </span>
                  </Button>
                ))}

                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Otra"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="h-full text-center font-semibold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
              </div>

              {tipAmount > 0 && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-3 flex justify-between items-center">
                    <span className="text-sm font-medium">Propina agregada</span>
                    <span className="text-lg font-bold text-accent">
                      +${tipAmount.toFixed(2)}
                    </span>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tipo de Cobro */}
            <div className="space-y-3">
              <h3 className="font-semibold">Tipo de Cobro</h3>
              <RadioGroup value={splitType} onValueChange={setSplitType}>
                <div className="space-y-2">
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:border-accent",
                      splitType === "full" && "border-accent border-2 bg-accent/5"
                    )}
                    onClick={() => setSplitType("full")}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="font-medium cursor-pointer">
                          Cuenta Completa
                        </Label>
                      </div>
                      <span className="text-lg font-bold text-accent">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>

                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:border-accent",
                      splitType === "equal" && "border-accent border-2 bg-accent/5"
                    )}
                    onClick={() => setSplitType("equal")}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal" className="font-medium cursor-pointer flex-1">
                        Dividir en Partes Iguales
                      </Label>
                    </CardContent>
                  </Card>

                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:border-accent",
                      splitType === "items" && "border-accent border-2 bg-accent/5"
                    )}
                    onClick={() => setSplitType("items")}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="items" id="items" />
                      <Label htmlFor="items" className="font-medium cursor-pointer flex-1">
                        Seleccionar Items
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>

              {splitType === "items" && (
                <Card className="border-accent/30">
                  <CardContent className="p-4 space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x ${Number(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-semibold">
                          ${Number(item.total).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Método de Pago */}
            <div className="space-y-3">
              <h3 className="font-semibold">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-accent hover:shadow-md",
                        paymentMethod === method.name && "border-accent border-2 bg-accent/5"
                      )}
                      onClick={() => setPaymentMethod(method.name)}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                        <div className={cn(
                          "p-3 rounded-full transition-colors",
                          paymentMethod === method.name ? "bg-accent text-accent-foreground" : "bg-muted"
                        )}>
                          {getPaymentIcon(method.name)}
                        </div>
                        <span className="font-medium text-sm leading-tight">
                          {method.name}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  ["Efectivo", "Tarjeta", "Transferencia"].map((method) => (
                    <Card
                      key={method}
                      className={cn(
                        "cursor-pointer transition-all hover:border-accent",
                        paymentMethod === method && "border-accent border-2 bg-accent/5"
                      )}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <div className={cn(
                          "p-3 rounded-full",
                          paymentMethod === method ? "bg-accent text-accent-foreground" : "bg-muted"
                        )}>
                          {getPaymentIcon(method)}
                        </div>
                        <span className="font-medium text-sm">{method}</span>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer con total y botones */}
        <div className="border-t p-6 space-y-4 bg-muted/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total a Cobrar</p>
              <p className="text-3xl font-bold text-accent">
                ${calculateSplitTotal().toFixed(2)}
              </p>
            </div>
            {tipAmount > 0 && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                Incluye ${tipAmount.toFixed(2)} de propina
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isProcessing || !paymentMethod}
              className="flex-1 text-lg py-6"
            >
              {isProcessing ? "Procesando..." : "Confirmar Cobro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}