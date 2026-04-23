import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";

export interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  daysRemaining: number;
  planName: string;
  status: string;
  loading: boolean;
}

export function useSubscription() {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isTrial: false,
    daysRemaining: 0,
    planName: "",
    status: "",
    loading: true,
  });

  useEffect(() => {
    console.log("🔄 [SUBSCRIPTION HOOK] useEffect triggered - starting subscription check");
    console.log("🔄 [SUBSCRIPTION HOOK] Current pathname:", router.pathname);
    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log("🔄 [SUBSCRIPTION HOOK] Auth state changed - rechecking subscription");
      checkSubscription();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSubscription() {
    try {
      console.log("🔍 [SUBSCRIPTION HOOK] Starting subscription check...");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("❌ [SUBSCRIPTION HOOK] No user found");
        setSubscriptionStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] User found:", user.id);
      console.log("✅ [SUBSCRIPTION HOOK] User email:", user.email);

      // CRITICAL: Check if user is Super Admin FIRST
      console.log("🔍 [SUBSCRIPTION HOOK] Checking if user is Super Admin...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      console.log("🔍 [SUBSCRIPTION HOOK] Profile data:", profile);
      console.log("🔍 [SUBSCRIPTION HOOK] is_super_admin value:", profile?.is_super_admin);

      // Super Admins bypass ALL subscription checks
      if (profile?.is_super_admin === true) {
        console.log("👑👑👑 [SUBSCRIPTION HOOK] SUPER ADMIN DETECTED 👑👑👑");
        console.log("✅ [SUBSCRIPTION HOOK] Bypassing ALL subscription checks");
        console.log("✅ [SUBSCRIPTION HOOK] Setting unlimited access");
        setSubscriptionStatus({
          isActive: true,
          isTrial: false,
          daysRemaining: 999,
          planName: "Super Admin",
          status: "active",
          loading: false,
        });
        console.log("✅ [SUBSCRIPTION HOOK] Super Admin status set - DONE");
        return; // STOP HERE for Super Admins
      }

      console.log("👤 [SUBSCRIPTION HOOK] Regular user - checking subscription...");

      // Get user's business
      const business = await businessService.getCurrentBusiness();
      
      if (!business) {
        console.log("❌ [SUBSCRIPTION HOOK] No business found");
        setSubscriptionStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] Business found:", business.id);

      // Get subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (
            name
          )
        `)
        .eq("business_id", business.id)
        .maybeSingle();

      if (!subscription) {
        console.log("⚠️ [SUBSCRIPTION HOOK] No subscription found - redirecting to subscription page");
        setSubscriptionStatus(prev => ({ ...prev, loading: false }));
        router.push("/subscription");
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] Subscription found:", subscription.status);

      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      const isTrialing = subscription.status === "trialing" && endDate > now;
      const isActive = subscription.status === "active" || isTrialing;

      // Calculate days remaining
      let daysRemaining = 0;
      if (subscription.current_period_end) {
        const diff = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const planName = subscription.subscription_plans?.name || "Unknown";

      console.log("📊 [SUBSCRIPTION HOOK] Status:", {
        isActive,
        isTrialing,
        daysRemaining,
        planName,
        status: subscription.status
      });

      setSubscriptionStatus({
        isActive,
        isTrial: isTrialing,
        daysRemaining: Math.max(0, daysRemaining),
        planName,
        status: subscription.status,
        loading: false,
      });

      // Redirect to subscription page if not active and not already there
      if (!isActive && router.pathname !== "/subscription") {
        console.log("⚠️ [SUBSCRIPTION HOOK] Subscription expired - redirecting to subscription page");
        router.push("/subscription");
      }
    } catch (error) {
      console.error("💥 [SUBSCRIPTION HOOK] Error checking subscription:", error);
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
    }
  }

  return subscriptionStatus;
}