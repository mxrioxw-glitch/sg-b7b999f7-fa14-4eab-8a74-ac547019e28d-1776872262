import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Check, 
  X, 
  ArrowRight,
  Package,
  Users,
  Building2,
  Sparkles,
  Zap,
  Star,
  Crown
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

type LimitType = "products" | "employees" | "locations" | "feature";

type PlanInfoType = {
  name: string;
  icon: any;
  price: number;
  popular?: boolean;
  badge?: string;
  limits: {
    products: number | string;
    employees: number | string;
    locations: number | string;
  };
  features?: string[];
};

type UpgradePlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentPlan: "basic" | "professional" | "premium";
  currentLimit?: number;
  suggestedPlan: "professional" | "premium";
};

const LIMIT_INFO = {
  products: {
    icon: Package,
    title: "Límite de Productos Alcanzado",
    description: "Has llegado al límite máximo de productos para tu plan actual",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  employees: {
    icon: Users,
    title: "Límite de Empleados Alcanzado",
    description: "Has llegado al límite máximo de empleados para tu plan actual",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  locations: {
    icon: Building2,
    title: "Límite de Sucursales Alcanzado",
    description: "Has llegado al límite máximo de sucursales para tu plan actual",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  feature: {
    icon: Sparkles,
    title: "Funcionalidad No Disponible",
    description: "Esta funcionalidad requiere un plan superior",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
};

const PLAN_INFO: Record<string, PlanInfoType> = {
  basic: {
    name: "Básico",
    icon: Zap,
    price: 299,
    limits: {
      products: 50,
      employees: 2,
      locations: 1,
    },
  },
  professional: {
    name: "Profesional",
    icon: Star,
    price: 599,
    popular: true,
    limits: {
      products: 200,
      employees: "ilimitados",
      locations: 3,
    },
    features: [
      "Empleados ilimitados",
      "Hasta 200 productos",
      "3 sucursales",
      "Dashboard Avanzado",
      "Reportes Detallados",
      "Inventario Completo",
    ],
  },
  premium: {
    name: "Premium",
    icon: Crown,
    price: 999,
    badge: "Contactar",
    limits: {
      products: "ilimitados",
      employees: "ilimitados",
      locations: "ilimitados",
    },
    features: [
      "Todo ilimitado",
      "100% Personalizado",
      "Integraciones a medida",
      "Soporte 24/7 Dedicado",
      "Capacitación personalizada",
      "Consultoría especializada",
    ],
  },
};

export function UpgradePlanModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
  currentLimit,
  suggestedPlan,
}: UpgradePlanModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const limitInfo = LIMIT_INFO[limitType];
  const currentPlanInfo = PLAN_INFO[currentPlan];
  const suggestedPlanInfo = PLAN_INFO[suggestedPlan];
  
  const LimitIcon = limitInfo.icon;
  const CurrentPlanIcon = currentPlanInfo.icon;
  const SuggestedPlanIcon = suggestedPlanInfo.icon;

  async function handleUpgrade() {
    setIsProcessing(true);
    await router.push("/subscription");
    onClose();
  }

  function handleContact() {
    window.location.href = "mailto:soporte@nexumcloud.com?subject=Consulta Plan Premium";
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 text-white p-6 pb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <DialogHeader className="relative">
            <div className={`w-16 h-16 rounded-2xl ${limitInfo.bgColor} ${limitInfo.color} flex items-center justify-center mb-4 shadow-lg`}>
              <LimitIcon className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">{limitInfo.title}</DialogTitle>
            <DialogDescription className="text-white/90 text-base">
              {limitInfo.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Current vs Suggested Plan Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Plan */}
            <Card className="border-2 border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrentPlanIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-sm">Plan Actual</span>
                  </div>
                  <X className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentPlanInfo.name}</p>
                  <p className="text-sm text-muted-foreground">${currentPlanInfo.price}/mes</p>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  {limitType === "products" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Productos</span>
                      <span className="font-semibold text-red-600">
                        {currentLimit}/{currentPlanInfo.limits.products}
                      </span>
                    </div>
                  )}
                  {limitType === "employees" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Empleados</span>
                      <span className="font-semibold text-red-600">
                        {currentLimit}/{currentPlanInfo.limits.employees}
                      </span>
                    </div>
                  )}
                  {limitType === "locations" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sucursales</span>
                      <span className="font-semibold text-red-600">
                        {currentLimit}/{currentPlanInfo.limits.locations}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Plan */}
            <Card className="border-2 border-accent shadow-lg shadow-accent/20 relative overflow-hidden">
              {suggestedPlanInfo.popular && (
                <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Recomendado
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SuggestedPlanIcon className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-sm text-accent">Plan Sugerido</span>
                  </div>
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{suggestedPlanInfo.name}</p>
                  {suggestedPlanInfo.badge ? (
                    <Badge variant="outline" className="mt-1">{suggestedPlanInfo.badge}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">${suggestedPlanInfo.price}/mes</p>
                  )}
                </div>
                <div className="space-y-2 pt-2 border-t border-accent/20">
                  {limitType === "products" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Productos</span>
                      <span className="font-semibold text-accent">
                        {suggestedPlanInfo.limits.products}
                      </span>
                    </div>
                  )}
                  {limitType === "employees" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Empleados</span>
                      <span className="font-semibold text-accent">
                        {suggestedPlanInfo.limits.employees}
                      </span>
                    </div>
                  )}
                  {limitType === "locations" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sucursales</span>
                      <span className="font-semibold text-accent">
                        {suggestedPlanInfo.limits.locations}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          {suggestedPlanInfo.features && (
            <div>
              <p className="text-sm font-semibold mb-3">Lo que obtendrás al mejorar:</p>
              <div className="grid gap-2">
                {suggestedPlanInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-full bg-accent/10 p-0.5">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Difference */}
          {!suggestedPlanInfo.badge && (
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inversión adicional</p>
                  <p className="text-2xl font-bold text-accent">
                    ${suggestedPlanInfo.price - currentPlanInfo.price}
                    <span className="text-sm text-muted-foreground font-normal">/mes</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Nuevo total</p>
                  <p className="text-lg font-semibold">
                    ${suggestedPlanInfo.price}
                    <span className="text-sm text-muted-foreground font-normal">/mes</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          {suggestedPlanInfo.badge ? (
            <Button onClick={handleContact} className="w-full sm:w-auto">
              <Crown className="mr-2 h-4 w-4" />
              Contactar Ventas
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Procesando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Mejorar Plan Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}