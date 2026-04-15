import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { subscriptionService, type SubscriptionPlan, type PlanFeatures } from "@/services/subscriptionService";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionState {
  loading: boolean;
  isActive: boolean;
  isInTrial: boolean;
  plan: SubscriptionPlan | null;
  features: PlanFeatures | null;
}

export function useSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    isActive: false,
    isInTrial: false,
    plan: null,
    features: null,
  });

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const [isActive, isInTrial, plan, features] = await Promise.all([
        subscriptionService.isSubscriptionActive(),
        subscriptionService.isInTrial(),
        subscriptionService.getCurrentPlan(),
        subscriptionService.getPlanFeatures(),
      ]);

      setState({
        loading: false,
        isActive,
        isInTrial,
        plan,
        features,
      });
    } catch (error) {
      console.error("Error loading subscription:", error);
      setState({
        loading: false,
        isActive: false,
        isInTrial: false,
        plan: null,
        features: null,
      });
    }
  }

  async function checkFeatureAccess(feature: string): Promise<boolean> {
    const result = await subscriptionService.hasFeatureAccess(feature);
    
    if (!result.hasAccess) {
      toast({
        title: "Funcionalidad no disponible",
        description: result.reason || "Tu plan actual no incluye esta funcionalidad",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  async function checkProductLimit(): Promise<boolean> {
    const result = await subscriptionService.canAddProduct();
    
    if (!result.canAdd) {
      toast({
        title: "Límite alcanzado",
        description: result.reason || "Has alcanzado el límite de productos",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  async function checkEmployeeLimit(): Promise<boolean> {
    const result = await subscriptionService.canAddEmployee();
    
    if (!result.canAdd) {
      toast({
        title: "Límite alcanzado",
        description: result.reason || "Has alcanzado el límite de empleados",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  function redirectToUpgrade() {
    router.push("/subscription");
  }

  return {
    ...state,
    checkFeatureAccess,
    checkProductLimit,
    checkEmployeeLimit,
    redirectToUpgrade,
    refresh: loadSubscription,
  };
}