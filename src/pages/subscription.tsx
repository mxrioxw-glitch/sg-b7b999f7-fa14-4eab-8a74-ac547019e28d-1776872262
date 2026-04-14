import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { Check, Crown, Zap, Star, Calendar, CreditCard, AlertCircle } from "lucide-react";

const PLANS = [
  {
    id: "basic",
    name: "Básico",
    price: 299,
    icon: Zap,
    features: [
      "1 sucursal",
      "Hasta 100 productos",
      "2 empleados",
      "Reportes básicos",
      "Soporte por email",
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
      "Productos ilimitados",
      "5 empleados",
      "Reportes avanzados",
      "Soporte prioritario",
      "Integración con contabilidad",
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
      "Reportes personalizados",
      "Soporte 24/7",
      "API access",
      "Gestor de cuenta dedicado",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  async function loadSubscriptionData() {
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
        setDaysRemaining(7);
        return;
      }

      setCurrentSubscription(subscription);

      // Calculate days remaining
      if (subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, days));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return PLANS.find(p => p.id === currentSubscription.plan) || PLANS[0];
  };

  const handleUpgrade = (planId: string) => {
    toast({
      title: "Próximamente",
      description: "La funcionalidad de upgrade estará disponible pronto. Contacta a soporte.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent text-white";
      case "trial":
        return "bg-blue-500 text-white";
      case "expired":
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
        return "Cancelada";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-8">
            <p>Cargando...</p>
          </main>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const trialProgress = currentSubscription?.status === "trialing" 
    ? ((7 - daysRemaining) / 7) * 100 
    : 100;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Suscripción</h1>
            <p className="text-muted-foreground">Administra tu plan y facturación</p>
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
                      {currentSubscription?.status === "trialing" 
                        ? "Estás en período de prueba gratuita"
                        : "Tu suscripción actual"}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(currentSubscription?.status || "")}>
                    {getStatusText(currentSubscription?.status || "")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSubscription?.status === "trialing" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Días restantes de prueba</span>
                      <span className="font-semibold">{daysRemaining} de 7 días</span>
                    </div>
                    <Progress value={trialProgress} className="h-2" />
                    {daysRemaining <= 3 && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            Tu prueba está por terminar
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Actualiza tu suscripción para continuar usando todas las funciones
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
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
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Precio mensual</p>
                      <p className="font-medium">${currentPlan?.price || 0} MXN</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Planes Disponibles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = currentPlan?.id === plan.id;

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.popular ? "border-accent border-2" : ""} ${isCurrent ? "bg-muted/50" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-white">Más Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-8 w-8 text-primary" />
                        {isCurrent && (
                          <Badge variant="outline">Plan Actual</Badge>
                        )}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.price}</span>
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
                        variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isCurrent ? "Plan Actual" : "Elegir Plan"}
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
                  Cuando tu prueba termine, necesitarás seleccionar un plan de pago para continuar usando el sistema. Tus datos se mantendrán seguros.
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
    </div>
  );
}