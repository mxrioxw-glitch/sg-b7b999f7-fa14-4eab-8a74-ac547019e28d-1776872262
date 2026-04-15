import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Subscription = Tables<"subscriptions">;
export type SubscriptionPlan = "basic" | "professional" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing" | "expired";

export interface PlanFeatures {
  products: number;
  employees: number;
  features: string[];
  name: string;
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanFeatures> = {
  basic: {
    products: 50,
    employees: 2,
    features: ["pos", "products", "basic_reports"],
    name: "Básico",
    description: "Ideal para negocios pequeños que inician"
  },
  professional: {
    products: 200,
    employees: 5,
    features: ["pos", "products", "inventory", "customers", "cash_register", "reports", "dashboard"],
    name: "Profesional",
    description: "Para negocios en crecimiento"
  },
  premium: {
    products: -1, // unlimited
    employees: -1, // unlimited
    features: ["all"],
    name: "Premium",
    description: "Acceso completo sin restricciones"
  },
};

export const subscriptionService = {
  async getActiveSubscription(businessId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data || null;
  },

  async getCurrentSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) return null;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data;
  },

  async isSubscriptionActive(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    const now = new Date();
    const endDate = new Date(subscription.current_period_end);

    return (
      subscription.status === "active" ||
      (subscription.status === "trialing" && endDate > now)
    );
  },

  async isInTrial(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    const now = new Date();
    const endDate = new Date(subscription.current_period_end);

    return subscription.status === "trialing" && endDate > now;
  },

  async getCurrentPlan(): Promise<SubscriptionPlan | null> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return null;

    // Durante el trial, devolver el plan real (no siempre premium)
    return subscription.plan as SubscriptionPlan;
  },

  async getPlanFeatures(): Promise<PlanFeatures | null> {
    const plan = await this.getCurrentPlan();
    if (!plan) return null;

    return PLAN_LIMITS[plan];
  },

  async hasFeatureAccess(feature: string): Promise<{ hasAccess: boolean; reason?: string; plan?: SubscriptionPlan }> {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription) {
      return { 
        hasAccess: false, 
        reason: "No tienes una suscripción activa" 
      };
    }

    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const isActive = subscription.status === "active" || 
                    (subscription.status === "trialing" && endDate > now);

    if (!isActive) {
      return { 
        hasAccess: false, 
        reason: "Tu suscripción ha expirado" 
      };
    }

    const plan = subscription.plan as SubscriptionPlan;
    const planLimits = PLAN_LIMITS[plan];

    // Durante trial con plan premium, acceso total
    if (subscription.status === "trialing" && plan === "premium") {
      return { hasAccess: true, plan };
    }

    // Plan premium tiene acceso a todo
    if (planLimits.features.includes("all")) {
      return { hasAccess: true, plan };
    }

    // Verificar si el plan incluye la funcionalidad
    if (planLimits.features.includes(feature)) {
      return { hasAccess: true, plan };
    }

    // Determinar qué plan se necesita
    let requiredPlan = "professional";
    if (PLAN_LIMITS.basic.features.includes(feature)) {
      requiredPlan = "basic";
    } else if (PLAN_LIMITS.premium.features.includes("all")) {
      requiredPlan = "premium";
    }

    return { 
      hasAccess: false, 
      reason: `Esta funcionalidad requiere el plan ${PLAN_LIMITS[requiredPlan as SubscriptionPlan].name}`,
      plan
    };
  },

  async canAddProduct(): Promise<{ canAdd: boolean; reason?: string; current?: number; limit?: number }> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) {
      return { canAdd: false, reason: "No tienes una suscripción activa" };
    }

    const plan = subscription.plan as SubscriptionPlan;
    const planLimits = PLAN_LIMITS[plan];

    // Premium o ilimitado
    if (planLimits.products === -1) {
      return { canAdd: true };
    }

    // Durante trial, usar límites del plan
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { canAdd: false, reason: "Usuario no autenticado" };

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) return { canAdd: false, reason: "Negocio no encontrado" };

    // Contar productos actuales
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    const currentCount = count || 0;

    if (currentCount >= planLimits.products) {
      return { 
        canAdd: false, 
        reason: `Has alcanzado el límite de ${planLimits.products} productos de tu plan ${planLimits.name}`,
        current: currentCount,
        limit: planLimits.products
      };
    }

    return { 
      canAdd: true,
      current: currentCount,
      limit: planLimits.products
    };
  },

  async canAddEmployee(): Promise<{ canAdd: boolean; reason?: string; current?: number; limit?: number }> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) {
      return { canAdd: false, reason: "No tienes una suscripción activa" };
    }

    const plan = subscription.plan as SubscriptionPlan;
    const planLimits = PLAN_LIMITS[plan];

    // Premium o ilimitado
    if (planLimits.employees === -1) {
      return { canAdd: true };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { canAdd: false, reason: "Usuario no autenticado" };

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) return { canAdd: false, reason: "Negocio no encontrado" };

    // Contar empleados actuales
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    const currentCount = count || 0;

    if (currentCount >= planLimits.employees) {
      return { 
        canAdd: false, 
        reason: `Has alcanzado el límite de ${planLimits.employees} empleados de tu plan ${planLimits.name}`,
        current: currentCount,
        limit: planLimits.employees
      };
    }

    return { 
      canAdd: true,
      current: currentCount,
      limit: planLimits.employees
    };
  },

  async createTrialSubscription(businessId: string): Promise<void> {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 days trial

    await supabase.from("subscriptions").insert({
      business_id: businessId,
      plan: "premium", // Full access during trial
      status: "trialing",
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnd.toISOString(),
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(),
    });
  },
};