import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, Banknote, Coins, User, X, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  type: "cash_mxn" | "cash_usd" | "card" | "points";
  amount: number;
  customerId?: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  customers?: { id: string; name: string; points: number }[];
  onConfirm: (payments: PaymentMethod[], change: number) => void;
  processing?: boolean;
  hasCashRegister?: boolean;
  onOpenCashRegister?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  total,
  subtotal,
  taxAmount,
  taxRate,
  customers = [],
  onConfirm,
  processing = false,
  hasCashRegister = true,
  onOpenCashRegister,
}: PaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeTab, setActiveTab] = useState<"cash_mxn" | "cash_usd" | "card" | "points">("cash_mxn");
  
  const [cashMxnAmount, setCashMxnAmount] = useState<string>("");
  const [cashUsdAmount, setCashUsdAmount] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("17.00");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [pointsToUse, setPointsToUse] = useState<string>("");
  
  const isMobileOrTablet = useIsMobileOrTablet();
  const pointValue = 1;

  useEffect(() => {
    if (!open) {
      setPaymentMethods([]);
      setCashMxnAmount("");
      setCashUsdAmount("");
      setCardAmount("");
      setPointsToUse("");
      setSelectedCustomer("");
      setActiveTab("cash_mxn");
    }
  }, [open]);

  const totalPaid = paymentMethods.reduce((sum, pm) => {
    if (pm.type === "cash_usd") {
      return sum + (pm.amount * parseFloat(exchangeRate));
    }
    return sum + pm.amount;
  }, 0);

  const remaining = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  const addPaymentMethod = () => {
    let amount = 0;
    const type: PaymentMethod["type"] = activeTab;
    let customerId: string | undefined;

    switch (activeTab) {
      case "cash_mxn":
        amount = parseFloat(cashMxnAmount);
        setCashMxnAmount("");
        break;
      case "cash_usd":
        amount = parseFloat(cashUsdAmount);
        setCashUsdAmount("");
        break;
      case "card":
        amount = parseFloat(cardAmount);
        setCardAmount("");
        break;
      case "points":
        amount = parseFloat(pointsToUse);
        customerId = selectedCustomer;
        setPointsToUse("");
        break;
    }

    if (amount > 0) {
      setPaymentMethods([...paymentMethods, { type, amount, customerId }]);
    }
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleQuickCash = (amount: number) => {
    setCashMxnAmount(amount.toString());
  };

  const handleConfirm = () => {
    if (remaining > 0) return;
    onConfirm(paymentMethods, change);
  };

  const getPaymentIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "cash_mxn": return <Banknote className="h-4 w-4" />;
      case "cash_usd": return <DollarSign className="h-4 w-4" />;
      case "card": return <CreditCard className="h-4 w-4" />;
      case "points": return <Coins className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "cash_mxn": return "Efectivo MXN";
      case "cash_usd": return "Efectivo USD";
      case "card": return "Tarjeta";
      case "points": return "Puntos";
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const maxPoints = selectedCustomerData ? Math.min(selectedCustomerData.points, remaining) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "overflow-y-auto",
        isMobileOrTablet ? "max-w-[95vw] max-h-[95vh] p-0" : "max-w-4xl max-h-[90vh]"
      )}>
        <DialogHeader className={cn(isMobileOrTablet && "p-4 border-b border-border sticky top-0 bg-card z-10")}>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-2xl">
            <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-accent" />
            Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <div className={cn(
          "space-y-4",
          isMobileOrTablet ? "p-4" : "px-6 pb-6"
        )}>
          {/* Cash Register Warning */}
          {!hasCashRegister && onOpenCashRegister && (
            <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">No hay turno de caja abierto</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Abre un turno antes de procesar el pago para registrar correctamente las ventas
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenCashRegister();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Abrir Turno Ahora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={cn(
            "grid gap-4 md:gap-6",
            isMobileOrTablet ? "grid-cols-1" : "grid-cols-2"
          )}>
            {/* Payment Methods Section */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  <TabsTrigger value="cash_mxn" className="text-[10px] sm:text-xs px-1 py-2">
                    <Banknote className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">MXN</span>
                  </TabsTrigger>
                  <TabsTrigger value="cash_usd" className="text-[10px] sm:text-xs px-1 py-2">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">USD</span>
                  </TabsTrigger>
                  <TabsTrigger value="card" className="text-[10px] sm:text-xs px-1 py-2">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Tarjeta</span>
                  </TabsTrigger>
                  <TabsTrigger value="points" className="text-[10px] sm:text-xs px-1 py-2">
                    <Coins className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Puntos</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cash_mxn" className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Efectivo recibido (MXN)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cashMxnAmount}
                      onChange={(e) => setCashMxnAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-base md:text-lg h-12 md:h-auto"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500, 1000].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        onClick={() => handleQuickCash(amount)}
                        className={cn("h-10 text-sm", amount === 1000 && "col-span-3")}
                      >
                        ${amount.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCashMxnAmount(remaining.toFixed(2))}
                      className="col-span-3 h-10 text-sm"
                    >
                      Exacto (${remaining.toFixed(2)})
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="cash_usd" className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Tipo de cambio USD → MXN</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="17.00"
                      className="h-12 md:h-auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Efectivo recibido (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cashUsdAmount}
                      onChange={(e) => setCashUsdAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-base md:text-lg h-12 md:h-auto"
                    />
                    {cashUsdAmount && (
                      <p className="text-xs md:text-sm text-muted-foreground">
                        = ${(parseFloat(cashUsdAmount) * parseFloat(exchangeRate)).toFixed(2)} MXN
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="card" className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Monto con tarjeta (MXN)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-base md:text-lg h-12 md:h-auto"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCardAmount(remaining.toFixed(2))}
                    className="w-full h-10"
                  >
                    Pagar restante (${remaining.toFixed(2)})
                  </Button>
                </TabsContent>

                <TabsContent value="points" className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Seleccionar cliente</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger className="h-12 md:h-auto">
                        <SelectValue placeholder="Buscar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="text-sm">{customer.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({customer.points} pts)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCustomer && (
                    <>
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="text-muted-foreground text-xs">Puntos disponibles:</p>
                        <p className="text-xl md:text-2xl font-bold">{selectedCustomerData?.points || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">1 punto = $1.00 MXN</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Puntos a usar</Label>
                        <Input
                          type="number"
                          value={pointsToUse}
                          onChange={(e) => setPointsToUse(e.target.value)}
                          placeholder="0"
                          max={maxPoints}
                          className="text-base md:text-lg h-12 md:h-auto"
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo: {maxPoints} puntos (${maxPoints.toFixed(2)})
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPointsToUse(Math.min(maxPoints, remaining).toString())}
                        className="w-full h-10"
                        disabled={maxPoints === 0}
                      >
                        Usar máximo disponible
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                type="button"
                onClick={addPaymentMethod}
                className="w-full h-12 md:h-10"
                disabled={
                  (activeTab === "cash_mxn" && !cashMxnAmount) ||
                  (activeTab === "cash_usd" && !cashUsdAmount) ||
                  (activeTab === "card" && !cardAmount) ||
                  (activeTab === "points" && (!pointsToUse || !selectedCustomer))
                }
              >
                Agregar Pago
              </Button>
            </div>

            {/* Summary Section */}
            <div className="space-y-3 md:space-y-4">
              {/* Total Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 md:pt-3 flex justify-between">
                    <span className="text-base md:text-lg font-bold">Total a Pagar</span>
                    <span className="text-xl md:text-2xl font-bold text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Applied */}
              {paymentMethods.length > 0 && (
                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <h4 className="font-semibold mb-2 md:mb-3 text-xs md:text-sm">Pagos Aplicados</h4>
                    <div className="space-y-2">
                      {paymentMethods.map((pm, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(pm.type)}
                            <span className="text-xs md:text-sm">{getPaymentLabel(pm.type)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs md:text-sm">
                              {pm.type === "cash_usd" ? (
                                <>
                                  ${pm.amount.toFixed(2)} USD
                                  <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                                    (${(pm.amount * parseFloat(exchangeRate)).toFixed(2)} MXN)
                                  </span>
                                </>
                              ) : pm.type === "points" ? (
                                `${pm.amount} pts`
                              ) : (
                                `$${pm.amount.toFixed(2)}`
                              )}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePaymentMethod(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Status */}
              <Card className={`border-2 ${
                remaining === 0 && totalPaid > 0
                  ? "border-accent bg-accent/5"
                  : remaining > 0
                  ? "border-orange-500 bg-orange-50"
                  : "border-border"
              }`}>
                <CardContent className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Total Pagado</span>
                    <span className="text-lg md:text-xl font-bold text-primary">
                      ${totalPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Restante</span>
                    <span className={`text-lg md:text-xl font-bold ${
                      remaining > 0 ? "text-orange-600" : "text-accent"
                    }`}>
                      ${remaining.toFixed(2)}
                    </span>
                  </div>
                  {change > 0 && (
                    <div className="border-t border-border pt-2 md:pt-3 flex justify-between items-center">
                      <span className="text-sm md:text-base font-semibold">Cambio</span>
                      <span className="text-2xl md:text-3xl font-bold text-accent">
                        ${change.toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirm}
                disabled={remaining > 0 || totalPaid === 0 || processing}
                className="w-full h-12 md:h-14 text-base md:text-lg"
                size="lg"
              >
                {processing
                  ? "Procesando..."
                  : remaining > 0
                  ? `Falta $${remaining.toFixed(2)}`
                  : "Confirmar Pago"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}