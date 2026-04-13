import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Subscription = Tables<"subscriptions">;
export type SubscriptionPlan = "free_trial" | "basic" | "professional" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export const PLAN_LIMITS = {
  free_trial: {
    products: 10,
    employees: 1,
    features: ["sales", "basic_reports"],
  },
  basic: {
    products: 50,
    employees: 2,
    features: ["sales", "products", "basic_reports"],
  },
  professional: {
    products: 200,
    employees: 5,
    features: ["sales", "products", "inventory", "customers", "cash_register", "reports"],
  },
  premium: {
    products: -1, // unlimited
    employees: -1, // unlimited
    features: ["all"],
  },
};

export const subscriptionService = {
  async getCurrentSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
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

  async hasFeatureAccess(feature: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    const planLimits = PLAN_LIMITS[subscription.plan as SubscriptionPlan];
    if (!planLimits) return false;

    if (planLimits.features.includes("all")) return true;
    return planLimits.features.includes(feature);
  },

  async checkProductLimit(currentCount: number): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    const planLimits = PLAN_LIMITS[subscription.plan as SubscriptionPlan];
    if (!planLimits) return false;

    if (planLimits.products === -1) return true; // unlimited
    return currentCount < planLimits.products;
  },

  async createTrialSubscription(userId: string): Promise<void> {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 days trial

    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: "free_trial",
      status: "trialing",
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnd.toISOString(),
    });
  },
};