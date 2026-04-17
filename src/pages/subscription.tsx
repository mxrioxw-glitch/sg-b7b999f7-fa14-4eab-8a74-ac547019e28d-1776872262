import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { Check, Crown, Zap, Star, Calendar, CreditCard, AlertCircle } from "lucide-react";
import type { Business } from "@/services/businessService";
import type { SubscriptionPlan } from "@/services/subscriptionService";

const PLANS = [
  {
    id: "basic",
    name: "Básico",
    price: 299,
    icon: Zap,
    features: [
      "1 sucursal",
      "Hasta 50 productos",
      "2 empleados",
      "Punto de Venta (POS)",
      "Reportes básicos",
    ],
  },
  {
    id: "professional",
    name: "Profesional",
    price: 599,
    icon: Star,
    popular: true,
    features: [
      "3 sucursales",
      "Hasta 200 productos",
      "5 empleados",
      "Inventario completo",
      "Gestión de clientes",
      "Corte de caja",
      "Dashboard y reportes avanzados",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    icon: Crown,
    features: [
      "Sucursales ilimitadas",
      "Productos ilimitados",
      "Empleados ilimitados",
      "Todas las funcionalidades",
      "Soporte prioritario 24/7",
      "API access",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isInTrial, setIsInTrial] = useState<boolean>(false);
  const [effectivePlan, setEffectivePlan] = useState<string>("basic");
  const [showCheckout, setShowCheckout] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const currentBusiness = await businessService.getCurrentBusiness();
      if (!currentBusiness) {
        router.push("/");
        return;
      }

      // Check if user is owner
      const userIsOwner = currentBusiness.owner_id === user.id;
      setIsOwner(userIsOwner);

      if (!userIsOwner) {
        // Employees cannot access subscription
        toast({
          title: "Acceso Denegado",
          description: "Solo el propietario del negocio puede gestionar suscripciones.",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      setBusiness(currentBusiness);
      await loadSubscriptionData(currentBusiness.id);
    } catch (error) {
      console.error("Error checking access:", error);
      toast({
        title: "Error",
        description: "No se pudo verificar el acceso. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptionData(businessId: string) {
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/auth/login");
        return;
      }

      setBusinessId(business.id);

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading subscription:", error);
        return;
      }

      // If no subscription exists, create a trial subscription
      if (!subscription) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7); // 7 days trial

        const { data: newSubscription, error: createError } = await supabase
          .from("subscriptions")
          .insert({
            business_id: business.id,
            plan: "premium", // Full access during trial
            status: "trialing",
            current_period_start: new Date().toISOString(),
            current_period_end: trialEnd.toISOString(),
            trial_start: new Date().toISOString(),
            trial_end: trialEnd.toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating trial subscription:", createError);
          return;
        }

        setCurrentSubscription(newSubscription);
        setIsInTrial(true);
        setEffectivePlan("premium");
        setDaysRemaining(7);
        return;
      }

      setCurrentSubscription(subscription);

      // Check if in trial
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      const isTrialing = subscription.status === "trialing" && endDate > now;
      
      // Debug logs
      console.log("=== SUBSCRIPTION DEBUG ===");
      console.log("Subscription data:", subscription);
      console.log("Current date:", now);
      console.log("End date:", endDate);
      console.log("Status:", subscription.status);
      console.log("Is trialing?:", isTrialing);
      console.log("========================");
      
      setIsInTrial(isTrialing);

      // Determine effective plan (Premium during trial, otherwise the subscribed plan)
      const plan = isTrialing ? "premium" : subscription.plan;
      console.log("Effective plan:", plan);
      setEffectivePlan(plan);

      // Calculate days remaining
      if (subscription.current_period_end) {
        const diff = endDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        console.log("Days remaining:", days);
        setDaysRemaining(Math.max(0, days));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getCurrentPlan = () => {
    return PLANS.find(p => p.id === effectivePlan) || PLANS[0];
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId as "basic" | "professional" | "premium");
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = async (billingCycle: "monthly" | "yearly") => {
    if (!businessId) return;

    setProcessingCheckout(true);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate new period dates
      const now = new Date();
      const periodEnd = new Date();
      if (billingCycle === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Update subscription to active status with new plan
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: selectedPlan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          billing_cycle: billingCycle,
        })
        .eq("business_id", businessId);

      if (error) throw error;

      toast({
        title: "¡Suscripción activada!",
        description: `Plan ${selectedPlan === "basic" ? "Básico" : selectedPlan === "professional" ? "Profesional" : "Premium"} activado correctamente. Ciclo: ${billingCycle === "monthly" ? "Mensual" : "Anual"}`,
      });

      setShowCheckout(false);
      await loadSubscriptionData(businessId!);
    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el pago",
        variant: "destructive",
      });
    } finally {
      setProcessingCheckout(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent text-white";
      case "trialing":
        return "bg-blue-500 text-white";
      case "expired":
      case "cancelled":
        return "bg-destructive text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "trialing":
        return "Prueba Gratis";
      case "expired":
        return "Expirada";
      case "canceled":
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  const currentPlan = getCurrentPlan();
  const trialProgress = isInTrial && daysRemaining > 0
    ? ((7 - daysRemaining) / 7) * 100 
    : 100;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <SEO 
          title="Suscripción - Nexum Cloud"
          description="Gestiona tu suscripción de Nexum Cloud"
        />
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Suscripción</h1>
            <p className="text-sm md:text-base text-muted-foreground">Administra tu plan y facturación</p>
          </div>

          {/* Current Subscription Status */}
          <div className="grid gap-6 mb-8">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {currentPlan && <currentPlan.icon className="h-6 w-6" />}
                      Plan {currentPlan?.name || "Básico"}
                    </CardTitle>
                    <CardDescription>
                      {isInTrial 
                        ? "Estás disfrutando de acceso completo Premium durante tu prueba gratuita"
                        : "Tu suscripción actual"}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(currentSubscription?.status || "")}>
                    {getStatusText(currentSubscription?.status || "")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isInTrial ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Días restantes de prueba</span>
                      <span className="font-semibold">{daysRemaining} de 7 días</span>
                    </div>
                    <Progress value={trialProgress} className="h-2" />
                    {daysRemaining <= 3 && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            Tu prueba está por terminar
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Actualiza tu suscripción para continuar usando todas las funciones Premium
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Acceso Premium Completo
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Durante tu prueba tienes acceso a todas las funcionalidades sin restricciones
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha de renovación</p>
                          <p className="font-medium">
                            {currentSubscription?.current_period_end 
                              ? new Date(currentSubscription.current_period_end).toLocaleDateString("es-MX", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Precio mensual</p>
                          <p className="font-medium">${currentPlan?.price || 0} MXN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Planes Disponibles</h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = currentPlan?.id === plan.id && !isInTrial;
                const isTrialPlan = isInTrial && plan.id === "premium";

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.popular ? "border-accent border-2" : ""} ${isCurrent || isTrialPlan ? "bg-muted/50" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-white">Más Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-8 w-8 text-primary" />
                        {(isCurrent || isTrialPlan) && (
                          <Badge variant="outline">
                            {isTrialPlan ? "Plan Actual (Trial)" : "Plan Actual"}
                          </Badge>
                        )}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-3xl md:text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground"> /mes</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrent || isTrialPlan ? "outline" : plan.popular ? "default" : "outline"}
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isTrialPlan ? "Tu Plan Actual (Trial)" : isCurrent ? "Plan Actual" : "Elegir Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h4>
                <p className="text-sm text-muted-foreground">
                  Sí, puedes cancelar tu suscripción en cualquier momento. Tu cuenta permanecerá activa hasta el final del período de facturación.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Qué pasa si mi prueba gratis termina?</h4>
                <p className="text-sm text-muted-foreground">
                  Cuando tu prueba de 7 días termine, necesitarás seleccionar un plan de pago para continuar usando el sistema. Tus datos se mantendrán seguros. Durante la prueba tienes acceso completo a todas las funcionalidades Premium.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Puedo cambiar de plan después?</h4>
                <p className="text-sm text-muted-foreground">
                  Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán en tu próximo período de facturación.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          open={showCheckout}
          onOpenChange={setShowCheckout}
          plan={selectedPlan}
          onConfirm={handleCheckoutConfirm}
          processing={processingCheckout}
        />
      )}
    </div>
  );
}