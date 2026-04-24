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
      <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] p-0 gap-0 rounded-none">
        <DialogHeader className="px-8 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-3xl font-bold">
            Cobrar {table?.table_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 h-full">
            {/* Columna Izquierda - Scroll */}
            <ScrollArea className="h-full pr-4">
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
            </ScrollArea>

            {/* Columna Derecha - Pagos */}
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1">
                <div className="space-y-6 pr-4">
                  {/* Pagos Agregados */}
                  {payments.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Pagos Agregados</h3>
                      {payments.map((payment) => (
                        <Card key={payment.id} className="bg-accent/5 border-accent/20">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getMethodIcon(payment.method_name)}
                              <div>
                                <p className="font-medium">{payment.method_name}</p>
                                {payment.reference && (
                                  <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold">${payment.amount.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePayment(payment.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Agregar Pago */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Agregar Pago</h3>
                    
                    {/* Métodos de Pago */}
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <Card
                          key={method.id}
                          className={`cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id
                              ? "ring-2 ring-accent border-accent bg-accent/5"
                              : "hover:border-accent/50"
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="flex flex-col items-center gap-3">
                              {getMethodIcon(method.name)}
                              <span className="text-base font-medium">{method.name}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                      <Label className="text-base">Monto</Label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="flex-1 text-2xl font-bold"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Referencia para Tarjeta */}
                    {needsReference(selectedPaymentMethod) && (
                      <div className="space-y-2">
                        <Label className="text-base">Referencia / Últimos 4 dígitos (opcional)</Label>
                        <Input
                          type="text"
                          placeholder="1234"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="text-lg"
                          maxLength={20}
                        />
                      </div>
                    )}

                    {/* Botón Agregar */}
                    <Button
                      onClick={addPayment}
                      disabled={!selectedPaymentMethod || !paymentAmount || remaining <= 0}
                      className="w-full h-14 text-lg"
                      variant="outline"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Agregar Pago
                    </Button>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer - Total y Botones */}
              <div className="border-t pt-6 mt-6 space-y-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-base">
                      <span className="text-muted-foreground">Total a Cobrar</span>
                      <span className="text-2xl font-bold">${totalToCharge.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-base">
                      <span className="text-muted-foreground">Total Pagado</span>
                      <span className="text-2xl font-bold text-accent">${totalPaid.toFixed(2)}</span>
                    </div>
                    {remaining > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center text-base">
                          <span className="text-muted-foreground">Restante</span>
                          <span className="text-3xl font-bold text-orange-600">${remaining.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="h-16 text-lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProcessPayment}
                    disabled={isProcessing || payments.length === 0 || remaining > 0.01}
                    className="h-16 text-lg bg-accent hover:bg-accent/90"
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
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}