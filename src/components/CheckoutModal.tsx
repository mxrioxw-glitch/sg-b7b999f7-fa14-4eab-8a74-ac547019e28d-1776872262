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
import { DollarSign, CreditCard, Wallet, Banknote, Receipt, TrendingUp, Check, Smartphone, Clock } from "lucide-react";
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
  const [splitType, setSplitType] = useState<"full" | "equal" | "items">("full");
  const [splitNumber, setSplitNumber] = useState(2);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [customTip, setCustomTip] = useState("");
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const order = tableOrder;
  
  // Calculamos los totales correctamente
  const orderSubtotal = order?.subtotal || 0;
  const orderTax = order?.tax_amount || 0;
  const orderTotal = orderSubtotal + orderTax; // SUMA correcta de subtotal + IVA

  // Calculamos propina y total final
  const currentTipAmount = selectedTipPercentage 
    ? (orderSubtotal * selectedTipPercentage) / 100 
    : (parseFloat(customTip) || 0);
  
  const finalTotal = orderTotal + currentTipAmount;

  // Calculamos el monto a cobrar según el tipo de división
  const calculateSplitTotal = () => {
    if (splitType === "full") return finalTotal;
    if (splitType === "equal") return finalTotal / splitNumber;
    
    // Si es por items
    const itemsTotal = selectedItems.reduce((total, itemId) => {
      const item = order?.table_order_items?.find((i: any) => i.id === itemId);
      return total + (item?.item_total || 0);
    }, 0);
    
    // Aplicamos propina proporcional a los items
    const proportionalTip = selectedItems.length > 0 && orderSubtotal > 0
      ? (itemsTotal / orderSubtotal) * currentTipAmount
      : 0;

    return itemsTotal + proportionalTip;
  };

  const getTipAmountForPercentage = (percentage: number) => {
    return (orderSubtotal * percentage) / 100;
  };

  const handleProcessPayment = async () => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Cobrar {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(90vh-220px)]">
            <div className="space-y-6 py-4 px-6">
              {/* Resumen de la cuenta */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Resumen de la cuenta</h3>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${orderSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA (16%)</span>
                      <span className="font-medium">${orderTax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total sin propina</span>
                      <span className="font-bold">${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propina */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">Propina (opcional)</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "10%", value: 10 },
                    { label: "15%", value: 15 },
                    { label: "20%", value: 20 },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selectedTipPercentage === option.value ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col gap-1 ${
                        selectedTipPercentage === option.value ? "bg-accent hover:bg-accent/90" : ""
                      }`}
                      onClick={() => {
                        setSelectedTipPercentage(option.value);
                        setCustomTip("");
                      }}
                    >
                      <span className="text-lg font-bold">{option.label}</span>
                      <span className="text-xs opacity-80">
                        ${getTipAmountForPercentage(option.value).toFixed(2)}
                      </span>
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={customTip !== "" ? "default" : "outline"}
                    className={`h-auto py-3 flex flex-col gap-1 ${
                      customTip !== "" ? "bg-accent hover:bg-accent/90" : ""
                    }`}
                    onClick={() => {
                      setSelectedTipPercentage(null);
                      const input = document.getElementById("custom-tip-input") as HTMLInputElement;
                      input?.focus();
                    }}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-xs">Otra</span>
                  </Button>
                </div>

                {customTip !== "" && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custom-tip-input"
                      type="number"
                      placeholder="Monto personalizado"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(e.target.value);
                        setSelectedTipPercentage(null);
                      }}
                      className="flex-1"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                {currentTipAmount > 0 && (
                  <Card className="bg-accent/10 border-accent/20">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Propina agregada</span>
                        <span className="font-bold text-accent text-lg">+${currentTipAmount.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tipo de Cobro */}
              <div className="space-y-3">
                <h3 className="font-semibold">Tipo de Cobro</h3>
                <RadioGroup value={splitType} onValueChange={(value: any) => setSplitType(value)}>
                  <Card
                    className={`cursor-pointer transition-all ${
                      splitType === "full" ? "ring-2 ring-accent border-accent" : ""
                    }`}
                    onClick={() => setSplitType("full")}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="cursor-pointer font-medium">
                          Cuenta Completa
                        </Label>
                      </div>
                      <span className="font-bold text-accent">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      splitType === "equal" ? "ring-2 ring-accent border-accent" : ""
                    }`}
                    onClick={() => setSplitType("equal")}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <RadioGroupItem value="equal" id="equal" />
                        <Label htmlFor="equal" className="cursor-pointer font-medium">
                          Dividir en Partes Iguales
                        </Label>
                      </div>
                      {splitType === "equal" && (
                        <div className="ml-7 flex items-center gap-2">
                          <Input
                            type="number"
                            min="2"
                            value={splitNumber}
                            onChange={(e) => setSplitNumber(parseInt(e.target.value) || 2)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            personas = ${(finalTotal / splitNumber).toFixed(2)} c/u
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      splitType === "items" ? "ring-2 ring-accent border-accent" : ""
                    }`}
                    onClick={() => setSplitType("items")}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <RadioGroupItem value="items" id="items" />
                        <Label htmlFor="items" className="cursor-pointer font-medium">
                          Seleccionar Items
                        </Label>
                      </div>
                      {splitType === "items" && (
                        <div className="ml-7 space-y-2 max-h-32 overflow-y-auto">
                          {order?.table_order_items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedItems([...selectedItems, item.id]);
                                  } else {
                                    setSelectedItems(selectedItems.filter((id) => id !== item.id));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`item-${item.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {item.quantity}x {item.products?.name} - ${item.item_total?.toFixed(2)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>

              {/* Método de Pago */}
              <div className="space-y-3">
                <h3 className="font-semibold">Método de Pago</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "ring-2 ring-accent border-accent bg-accent/5"
                          : "hover:border-accent/50"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {method.name === "Efectivo" && <Banknote className="h-6 w-6" />}
                          {method.name === "Tarjeta" && <CreditCard className="h-6 w-6" />}
                          {method.name === "Transferencia" && <Smartphone className="h-6 w-6" />}
                          {!["Efectivo", "Tarjeta", "Transferencia"].includes(method.name) && (
                            <DollarSign className="h-6 w-6" />
                          )}
                          <span className="text-xs font-medium">{method.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer con total y botones */}
        <div className="border-t px-6 py-4 bg-muted/30 space-y-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total a Cobrar</p>
              {currentTipAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  (Incluye propina de ${currentTipAmount.toFixed(2)})
                </p>
              )}
            </div>
            <p className="text-3xl font-bold text-accent">
              ${calculateSplitTotal().toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing || !paymentMethod}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirmar Cobro
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}