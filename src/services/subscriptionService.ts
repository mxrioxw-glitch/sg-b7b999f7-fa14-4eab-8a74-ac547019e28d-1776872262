import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { businessService } from "@/services/businessService";

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

export const PLAN_LIMITS = {
  basic: {
    max_products: 50,
    max_employees: 2,
    max_locations: 1,
    features: [
      "pos",
      "products",
      "inventory_basic",
      "customers",
      "cash_register",
      "dashboard_basic",
      "reports_basic"
    ],
  },
  professional: {
    max_products: 200,
    max_employees: -1, // unlimited
    max_locations: 3,
    features: [
      "pos",
      "products",
      "inventory_advanced",
      "customers",
      "cash_register",
      "dashboard_advanced",
      "reports_advanced",
      "employees",
      "kardex",
      "comedor", // coming soon
      "kitchen_display", // coming soon
      "whatsapp_orders" // coming soon
    ],
  },
  premium: {
    max_products: -1, // unlimited
    max_employees: -1, // unlimited
    max_locations: -1, // unlimited
    features: [
      "all",
      "custom_integrations",
      "priority_support",
      "training",
      "consulting"
    ],
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

  async hasFeatureAccess(feature: string): Promise<{ hasAccess: boolean; reason?: string }> {
    const plan = await this.getCurrentPlan();
    if (!plan) {
      return { hasAccess: false, reason: "No se encontró un plan activo" };
    }

    const limits = PLAN_LIMITS[plan];
    if (!limits) {
      return { hasAccess: false, reason: "Plan no válido" };
    }

    // Premium has all features
    if (limits.features.includes("all")) {
      return { hasAccess: true };
    }

    // Check if feature is in plan
    const hasAccess = limits.features.includes(feature);
    
    if (!hasAccess) {
      // Check if it's a "coming soon" feature
      if (["comedor", "kitchen_display", "whatsapp_orders"].includes(feature)) {
        return { 
          hasAccess: false, 
          reason: "Esta funcionalidad estará disponible próximamente en el Plan Profesional" 
        };
      }
      
      return { 
        hasAccess: false, 
        reason: "Esta funcionalidad no está disponible en tu plan actual. Actualiza tu plan para acceder." 
      };
    }

    return { hasAccess: true };
  },

  async canAddProduct(): Promise<{ canAdd: boolean; reason?: string }> {
    const plan = await this.getCurrentPlan();
    if (!plan) {
      return { canAdd: false, reason: "No se encontró un plan activo" };
    }

    const limits = PLAN_LIMITS[plan];
    if (!limits) {
      return { canAdd: false, reason: "Plan no válido" };
    }

    // Unlimited products
    if (limits.max_products === -1) {
      return { canAdd: true };
    }

    const business = await businessService.getCurrentBusiness();
    if (!business) {
      return { canAdd: false, reason: "No se encontró el negocio" };
    }

    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    if (error) {
      console.error("Error counting products:", error);
      return { canAdd: false, reason: "Error al verificar límite de productos" };
    }

    const currentCount = count || 0;
    
    if (currentCount >= limits.max_products) {
      return { 
        canAdd: false, 
        reason: `Has alcanzado el límite de ${limits.max_products} productos de tu plan ${plan === "basic" ? "Básico" : "Profesional"}. Actualiza tu plan para agregar más productos.` 
      };
    }

    return { canAdd: true };
  },

  async canAddEmployee(): Promise<{ canAdd: boolean; reason?: string }> {
    const plan = await this.getCurrentPlan();
    if (!plan) {
      return { canAdd: false, reason: "No se encontró un plan activo" };
    }

    const limits = PLAN_LIMITS[plan];
    if (!limits) {
      return { canAdd: false, reason: "Plan no válido" };
    }

    // Unlimited employees
    if (limits.max_employees === -1) {
      return { canAdd: true };
    }

    const business = await businessService.getCurrentBusiness();
    if (!business) {
      return { canAdd: false, reason: "No se encontró el negocio" };
    }

    const { count, error } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    if (error) {
      console.error("Error counting employees:", error);
      return { canAdd: false, reason: "Error al verificar límite de empleados" };
    }

    const currentCount = count || 0;
    
    if (currentCount >= limits.max_employees) {
      return { 
        canAdd: false, 
        reason: `Has alcanzado el límite de ${limits.max_employees} empleados de tu plan Básico. Actualiza a plan Profesional para empleados ilimitados.` 
      };
    }

    return { canAdd: true };
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