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

      // CRITICAL: Check if user is Super Admin FIRST - BEFORE any other logic
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
        console.log("✅ [SUBSCRIPTION HOOK] NO REDIRECT to /subscription");
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
        return; // CRITICAL: STOP HERE - no redirects for Super Admins
      }

      console.log("👤 [SUBSCRIPTION HOOK] Regular user - checking subscription...");

      // Get user's business
      const { data: employee } = await supabase
        .from("employees")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!employee) {
        console.log("❌ [SUBSCRIPTION HOOK] No active employee record");
        setSubscriptionStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] Business found:", employee.business_id);

      // Get subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (
            name,
            features
          )
        `)
        .eq("business_id", employee.business_id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!subscription) {
        console.log("⚠️ [SUBSCRIPTION HOOK] No subscription found for business");
        console.log("🔄 [SUBSCRIPTION HOOK] Redirecting to /subscription");
        setSubscriptionStatus(prev => ({ ...prev, loading: false }));
        
        // Only redirect if not already on subscription page
        if (router.pathname !== "/subscription" && router.pathname !== "/super-admin") {
          router.push("/subscription");
        }
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] Subscription found:", subscription.status);

      const now = new Date();
      const isTrial = subscription.status === "trialing";
      const periodEnd = new Date(subscription.current_period_end);
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // Check if subscription is valid
      const isActive = ["active", "trialing"].includes(subscription.status) && periodEnd > now;

      if (!isActive) {
        console.log("⚠️ [SUBSCRIPTION HOOK] Subscription inactive or expired");
        console.log("🔄 [SUBSCRIPTION HOOK] Redirecting to /subscription");
        setSubscriptionStatus({
          isActive: false,
          isTrial: false,
          daysRemaining: 0,
          planName: subscription.subscription_plans?.name || "",
          status: subscription.status,
          loading: false,
        });

        // Only redirect if not already on subscription page
        if (router.pathname !== "/subscription" && router.pathname !== "/super-admin") {
          router.push("/subscription");
        }
        return;
      }

      console.log("✅ [SUBSCRIPTION HOOK] Subscription is active");
      setSubscriptionStatus({
        isActive: true,
        isTrial,
        daysRemaining,
        planName: subscription.subscription_plans?.name || "",
        status: subscription.status,
        loading: false,
      });
    } catch (error) {
      console.error("❌ [SUBSCRIPTION HOOK] Error checking subscription:", error);
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
    }
  }

  return subscriptionStatus;
}