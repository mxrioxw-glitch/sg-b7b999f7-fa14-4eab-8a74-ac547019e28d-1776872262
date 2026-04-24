import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Banknote,
  CreditCard,
  Smartphone
} from "lucide-react";
import { tableService } from "@/services/tableService";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tableOrder: any;
  table: any;
  paymentMethods: any[];
}

export function CheckoutModal({ isOpen, onClose, onComplete, tableOrder, table, paymentMethods }: CheckoutModalProps) {
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [splitType, setSplitType] = useState<"full" | "equal" | "items">("full");
  const [splitNumber, setSplitNumber] = useState(2);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const order = tableOrder;
  
  // Calculamos los totales correctamente
  const orderSubtotal = order?.subtotal || 0;
  const orderTax = order?.tax_amount || 0;
  const orderTotal = orderSubtotal + orderTax;

  // Calculamos propina y total final
  const currentTipAmount = selectedTipPercentage 
    ? (orderSubtotal * selectedTipPercentage) / 100 
    : (parseFloat(customTip) || 0);
  
  const finalTotal = orderTotal + currentTipAmount;

  // Calculamos el monto a cobrar según el tipo de división
  const calculateSplitTotal = () => {
    if (splitType === "full") return finalTotal;
    if (splitType === "equal") return finalTotal / splitNumber;
    
    const itemsTotal = selectedItems.reduce((total, itemId) => {
      const item = order?.table_order_items?.find((i: any) => i.id === itemId);
      return total + (item?.item_total || 0);
    }, 0);
    
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
        title: "⚠️ Selecciona un método de pago",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const amountToCharge = calculateSplitTotal();

      if (splitType === "full") {
        await tableService.closeTable(table.id, order.id, {
          business_id: table.business_id,
          subtotal: orderSubtotal,
          tax_amount: orderTax,
          total_amount: finalTotal,
          tip_amount: currentTipAmount,
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
        toast({
          title: "✅ Cobro parcial exitoso",
          description: `Cobrado: $${amountToCharge.toFixed(2)} - Restante: $${(finalTotal - amountToCharge).toFixed(2)}`,
          className: "bg-accent text-accent-foreground",
        });
        
        if (splitType === "equal" && splitNumber > 1) {
          onClose();
        } else {
          onComplete();
        }
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "❌ Error al procesar el pago",
        description: error.message || "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-8 pt-6 pb-4 border-b">
          <DialogTitle className="text-3xl font-bold">
            Cobrar {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Resumen de la cuenta */}
            <Card className="bg-muted/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Resumen de la cuenta</h3>
                </div>
                <div className="space-y-2 text-base">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span className="font-medium">${orderTax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total sin propina</span>
                    <span className="font-bold">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Propina */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Propina (opcional)</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "10%", value: 10 },
                  { label: "15%", value: 15 },
                  { label: "20%", value: 20 },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedTipPercentage === option.value ? "default" : "outline"}
                    className={`h-auto py-4 flex flex-col gap-1.5 ${
                      selectedTipPercentage === option.value ? "bg-accent hover:bg-accent/90" : ""
                    }`}
                    onClick={() => {
                      setSelectedTipPercentage(option.value);
                      setCustomTip("");
                    }}
                  >
                    <span className="text-xl font-bold">{option.label}</span>
                    <span className="text-sm opacity-80">
                      ${getTipAmountForPercentage(option.value).toFixed(2)}
                    </span>
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={customTip !== "" ? "default" : "outline"}
                  className={`h-auto py-4 flex flex-col gap-1.5 ${
                    customTip !== "" ? "bg-accent hover:bg-accent/90" : ""
                  }`}
                  onClick={() => {
                    setSelectedTipPercentage(null);
                    const input = document.getElementById("custom-tip-input") as HTMLInputElement;
                    input?.focus();
                  }}
                >
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Otra</span>
                </Button>
              </div>

              {customTip !== "" && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="custom-tip-input"
                    type="number"
                    placeholder="Monto personalizado"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setSelectedTipPercentage(null);
                    }}
                    className="flex-1 text-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {currentTipAmount > 0 && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Propina agregada</span>
                      <span className="font-bold text-accent text-2xl">+${currentTipAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tipo de Cobro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipo de Cobro</h3>
              <RadioGroup value={splitType} onValueChange={(value: any) => setSplitType(value)}>
                <Card
                  className={`cursor-pointer transition-all ${
                    splitType === "full" ? "ring-2 ring-accent border-accent" : ""
                  }`}
                  onClick={() => setSplitType("full")}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="cursor-pointer font-medium text-base">
                        Cuenta Completa
                      </Label>
                    </div>
                    <span className="font-bold text-accent text-xl">
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
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal" className="cursor-pointer font-medium text-base">
                        Dividir en Partes Iguales
                      </Label>
                    </div>
                    {splitType === "equal" && (
                      <div className="ml-8 flex items-center gap-3">
                        <Input
                          type="number"
                          min="2"
                          value={splitNumber}
                          onChange={(e) => setSplitNumber(parseInt(e.target.value) || 2)}
                          className="w-24 text-lg"
                        />
                        <span className="text-base text-muted-foreground">
                          personas = <span className="font-bold text-accent">${(finalTotal / splitNumber).toFixed(2)}</span> c/u
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
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <RadioGroupItem value="items" id="items" />
                      <Label htmlFor="items" className="cursor-pointer font-medium text-base">
                        Seleccionar Items
                      </Label>
                    </div>
                    {splitType === "items" && (
                      <div className="ml-8 space-y-2 max-h-40 overflow-y-auto">
                        {order?.table_order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 py-1">
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
                              className="text-base cursor-pointer flex-1"
                            >
                              {item.quantity}x {item.products?.name} - <span className="font-medium">${item.item_total?.toFixed(2)}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Método de Pago */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-3">
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
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        {method.name === "Efectivo" && <Banknote className="h-10 w-10" />}
                        {method.name === "Tarjeta" && <CreditCard className="h-10 w-10" />}
                        {method.name === "Transferencia" && <Smartphone className="h-10 w-10" />}
                        {!["Efectivo", "Tarjeta", "Transferencia"].includes(method.name) && (
                          <DollarSign className="h-10 w-10" />
                        )}
                        <span className="text-base font-medium">{method.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Total y Botones */}
            <Card className="bg-accent/5 border-accent/30 mt-auto">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-muted-foreground">Total a Cobrar</span>
                    <span className="text-4xl font-bold text-accent">
                      ${calculateSplitTotal().toFixed(2)}
                    </span>
                  </div>
                  {currentTipAmount > 0 && (
                    <p className="text-sm text-muted-foreground text-right">
                      (Incluye propina de ${currentTipAmount.toFixed(2)})
                    </p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="h-14 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProcessPayment}
                    disabled={isProcessing || !paymentMethod}
                    className="h-14 text-base bg-accent hover:bg-accent/90"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5 mr-2" />
                        Confirmar Cobro
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info adicional si hay división */}
            {splitType !== "full" && (
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {splitType === "equal" 
                      ? `Cobrando ${splitNumber > 1 ? `1 de ${splitNumber}` : 'una'} parte${splitNumber > 1 ? 's' : ''}`
                      : `Cobrando ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} seleccionado${selectedItems.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}