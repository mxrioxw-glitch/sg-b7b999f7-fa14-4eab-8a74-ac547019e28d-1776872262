import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Calendar, Lock, Check } from "lucide-react";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "basic" | "professional" | "premium";
  onConfirm: (billingCycle: "monthly" | "yearly") => void;
  processing: boolean;
}

const planPrices = {
  basic: { monthly: 29, yearly: 290 },
  professional: { monthly: 49, yearly: 490 },
  premium: { monthly: 99, yearly: 990 },
};

const planNames = {
  basic: "Básico",
  professional: "Profesional",
  premium: "Premium",
};

export function CheckoutModal({
  open,
  onOpenChange,
  plan,
  onConfirm,
  processing,
}: CheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(" ").substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 2) {
      return digits.substring(0, 2) + "/" + digits.substring(2, 4);
    }
    return digits;
  };

  const formatCVV = (value: string) => {
    return value.replace(/\D/g, "").substring(0, 3);
  };

  const price = planPrices[plan] ? planPrices[plan][billingCycle] : 0;
  const discount = billingCycle === "yearly" ? Math.round(((planPrices[plan].monthly * 12 - price) / (planPrices[plan].monthly * 12)) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(billingCycle);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Contratar Plan {planNames[plan]}</DialogTitle>
          <DialogDescription>
            Completa los datos de pago para activar tu suscripción
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Cycle Selection */}
          <div className="space-y-3">
            <Label>Ciclo de facturación</Label>
            <RadioGroup value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
              <div className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="cursor-pointer font-normal">
                    Mensual
                  </Label>
                </div>
                <span className="font-semibold">${planPrices[plan].monthly}/mes</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="cursor-pointer font-normal">
                    Anual
                    {discount > 0 && (
                      <span className="ml-2 text-xs text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
                        Ahorra {discount}%
                      </span>
                    )}
                  </Label>
                </div>
                <div className="text-right">
                  <span className="font-semibold">${planPrices[plan].yearly}/año</span>
                  <p className="text-xs text-muted-foreground">≈ ${Math.round(price / 12)}/mes</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Nombre en la tarjeta</Label>
              <Input
                id="cardName"
                placeholder="Juan Pérez"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Número de tarjeta</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Fecha de expiración</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expiryDate"
                    placeholder="MM/AA"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(formatCVV(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Pago simulado:</span> Esta es una demostración. No se procesarán cargos reales. En producción, usarías Stripe o similar.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Pagar ${price}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}