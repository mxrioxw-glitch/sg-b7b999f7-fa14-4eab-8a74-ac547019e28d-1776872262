import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Banknote,
  CreditCard,
  Smartphone,
  Gift,
  Trash2,
  Plus
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

interface Payment {
  id: string;
  method_id: string;
  method_name: string;
  amount: number;
  reference?: string;
}

export function CheckoutModal({ isOpen, onClose, onComplete, tableOrder, table, paymentMethods }: CheckoutModalProps) {
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [splitType, setSplitType] = useState<"full" | "equal" | "items">("full");
  const [splitNumber, setSplitNumber] = useState(2);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
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

  const totalToCharge = calculateSplitTotal();
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalToCharge - totalPaid;

  // Auto-llenar el monto restante cuando se selecciona un método
  useEffect(() => {
    if (selectedPaymentMethod && remaining > 0) {
      setPaymentAmount(remaining.toFixed(2));
    }
  }, [selectedPaymentMethod, remaining]);

  const addPayment = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "⚠️ Selecciona un método de pago",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "⚠️ Ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    if (amount > remaining) {
      toast({
        title: "⚠️ El monto excede el restante",
        description: `Solo quedan $${remaining.toFixed(2)} por pagar`,
        variant: "destructive",
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
    const newPayment: Payment = {
      id: Date.now().toString(),
      method_id: selectedPaymentMethod,
      method_name: method?.name || "",
      amount,
      reference: paymentReference || undefined
    };

    setPayments([...payments, newPayment]);
    setSelectedPaymentMethod("");
    setPaymentAmount("");
    setPaymentReference("");

    toast({
      title: "✅ Pago agregado",
      description: `${method?.name}: $${amount.toFixed(2)}`,
      className: "bg-accent text-accent-foreground",
    });
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const getMethodIcon = (methodName: string) => {
    if (methodName === "Efectivo") return <Banknote className="h-8 w-8" />;
    if (methodName === "Tarjeta") return <CreditCard className="h-8 w-8" />;
    if (methodName === "Pago en Dólares") return <DollarSign className="h-8 w-8" />;
    if (methodName === "Pago con Puntos") return <Gift className="h-8 w-8" />;
    return <DollarSign className="h-8 w-8" />;
  };

  const needsReference = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.name === "Tarjeta";
  };

  const handleProcessPayment = async () => {
    if (payments.length === 0) {
      toast({
        title: "⚠️ Agrega al menos un pago",
        variant: "destructive",
      });
      return;
    }

    if (remaining > 0.01) {
      toast({
        title: "⚠️ Pago incompleto",
        description: `Faltan $${remaining.toFixed(2)} por pagar`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (splitType === "full") {
        await tableService.closeTable(table.id, order.id, {
          business_id: table.business_id,
          subtotal: orderSubtotal,
          tax_amount: orderTax,
          total_amount: finalTotal,
          tip_amount: currentTipAmount,
          payment_method: payments[0].method_id, // Usamos el primer método por compatibilidad
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
          description: `Cobrado: $${totalToCharge.toFixed(2)} - Restante: $${(finalTotal - totalToCharge).toFixed(2)}`,
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
      <DialogContent className="max-w-[100vw] w-full h-screen max-h-screen p-0 gap-0 rounded-none m-0">
        <DialogHeader className="px-6 py-3 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Cobrar {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-140px)] overflow-hidden">
          {/* Columna Izquierda - Sin scroll, todo compacto */}
          <div className="space-y-4 flex flex-col h-full">
            {/* Resumen de la cuenta */}
            <Card className="bg-muted/50 flex-shrink-0">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Resumen de la cuenta</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span className="font-medium">${orderTax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total sin propina</span>
                    <span className="font-bold">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Propina */}
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold">Propina (opcional)</h3>
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
                    size="sm"
                    className={`h-auto py-2 flex flex-col gap-0.5 ${
                      selectedTipPercentage === option.value ? "bg-accent hover:bg-accent/90" : ""
                    }`}
                    onClick={() => {
                      setSelectedTipPercentage(option.value);
                      setCustomTip("");
                    }}
                  >
                    <span className="text-base font-bold">{option.label}</span>
                    <span className="text-xs opacity-80">
                      ${getTipAmountForPercentage(option.value).toFixed(2)}
                    </span>
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={customTip !== "" ? "default" : "outline"}
                  size="sm"
                  className={`h-auto py-2 flex flex-col gap-0.5 ${
                    customTip !== "" ? "bg-accent hover:bg-accent/90" : ""
                  }`}
                  onClick={() => {
                    setSelectedTipPercentage(null);
                    const input = document.getElementById("custom-tip-input") as HTMLInputElement;
                    input?.focus();
                  }}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Otra</span>
                </Button>
              </div>

              {customTip !== "" && (
                <Input
                  id="custom-tip-input"
                  type="number"
                  placeholder="Monto personalizado"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setSelectedTipPercentage(null);
                  }}
                  className="text-sm h-9"
                  min="0"
                  step="0.01"
                />
              )}

              {currentTipAmount > 0 && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Propina agregada</span>
                      <span className="font-bold text-accent">+${currentTipAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tipo de Cobro */}
            <div className="space-y-2 flex-1 min-h-0">
              <h3 className="text-sm font-semibold">Tipo de Cobro</h3>
              <RadioGroup value={splitType} onValueChange={(value: any) => setSplitType(value)} className="space-y-2">
                <Card
                  className={`cursor-pointer transition-all ${
                    splitType === "full" ? "ring-2 ring-accent border-accent" : ""
                  }`}
                  onClick={() => setSplitType("full")}
                >
                  <CardContent className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="cursor-pointer text-sm font-medium">
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
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal" className="cursor-pointer text-sm font-medium">
                        Dividir en Partes Iguales
                      </Label>
                    </div>
                    {splitType === "equal" && (
                      <div className="ml-6 flex items-center gap-2 text-sm">
                        <Input
                          type="number"
                          min="2"
                          value={splitNumber}
                          onChange={(e) => setSplitNumber(parseInt(e.target.value) || 2)}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-muted-foreground">
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
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="items" id="items" />
                      <Label htmlFor="items" className="cursor-pointer text-sm font-medium">
                        Seleccionar Items
                      </Label>
                    </div>
                    {splitType === "items" && (
                      <div className="ml-6 space-y-1.5 max-h-24 overflow-y-auto">
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
                              className="text-xs cursor-pointer flex-1"
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
          <div className="space-y-4 flex flex-col h-full">
            {/* Métodos de Pago */}
            <div className="space-y-3 flex-shrink-0">
              <h3 className="text-sm font-semibold">Agregar Pago</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const getIcon = () => {
                    if (method.name === "Efectivo") return <Banknote className="h-6 w-6" />;
                    if (method.name === "Tarjeta") return <CreditCard className="h-6 w-6" />;
                    if (method.name === "Pago en Dólares") return <DollarSign className="h-6 w-6" />;
                    if (method.name === "Pago con Puntos") return <Gift className="h-6 w-6" />;
                    return <DollarSign className="h-6 w-6" />;
                  };

                  return (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "ring-2 ring-accent border-accent bg-accent/5"
                          : "hover:border-accent/50"
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {getIcon()}
                          <span className="text-xs font-medium">{method.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Monto y Referencia */}
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-sm">Monto</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="text-base h-10"
                min="0"
                step="0.01"
              />

              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name === "Tarjeta" && (
                <div className="space-y-2">
                  <Label className="text-sm">Referencia (últimos 4 dígitos)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="text-base h-10"
                  />
                </div>
              )}

              <Button
                onClick={addPayment}
                disabled={!selectedPaymentMethod || !paymentAmount}
                className="w-full h-10 bg-accent hover:bg-accent/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pago
              </Button>
            </div>

            {/* Lista de pagos */}
            {payments.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                <h3 className="text-sm font-semibold">Pagos Agregados</h3>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {payment.method_name === "Efectivo" && <Banknote className="h-4 w-4" />}
                          {payment.method_name === "Tarjeta" && <CreditCard className="h-4 w-4" />}
                          {payment.method_name === "Pago en Dólares" && <DollarSign className="h-4 w-4" />}
                          {payment.method_name === "Pago con Puntos" && <Gift className="h-4 w-4" />}
                          <div className="text-sm">
                            <p className="font-medium">{payment.method_name}</p>
                            {payment.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">${payment.amount.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePayment(payment.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Totales */}
            <Card className="bg-muted/30 flex-shrink-0">
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total a Cobrar</span>
                  <span className="font-bold">${totalToCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pagado</span>
                  <span className="font-bold text-accent">${totalPaid.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className={`font-semibold ${remaining > 0.01 ? "text-orange-600" : "text-green-600"}`}>
                    Restante
                  </span>
                  <span className={`text-xl font-bold ${remaining > 0.01 ? "text-orange-600" : "text-green-600"}`}>
                    ${remaining.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={isProcessing || payments.length === 0 || remaining > 0.01}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-base font-semibold"
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
      </DialogContent>
    </Dialog>
  );
}