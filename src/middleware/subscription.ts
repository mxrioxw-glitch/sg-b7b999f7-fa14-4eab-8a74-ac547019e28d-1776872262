import { GetServerSidePropsContext } from "next";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { subscriptionService } from "@/services/subscriptionService";

export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Starting check...");
  
  try {
    // Check auth first
    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Getting current session...");
    const session = await authService.getCurrentSession();
    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Session:", session ? "✅ Found" : "❌ Not found");

    if (!session?.user) {
      console.log("❌ [SUBSCRIPTION MIDDLEWARE] No session/user - redirecting to login");
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] User ID:", session.user.id);

    // Try to find business where user is owner
    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Looking for owned business...");
    const { data: ownedBusiness, error: ownerError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (ownerError) {
      console.error("❌ [SUBSCRIPTION MIDDLEWARE] Error finding owned business:", ownerError);
    }

    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Owned business:", ownedBusiness ? "✅ Found" : "Not owner");

    let business = ownedBusiness;

    // If not owner, check if user is an employee
    if (!business) {
      console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Not owner, checking if employee...");
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("business_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employeeError) {
        console.error("❌ [SUBSCRIPTION MIDDLEWARE] Error finding employee:", employeeError);
      }

      console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Employee record:", employee ? "✅ Found" : "❌ Not found");

      if (employee) {
        console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Getting business for employee...");
        const { data: employeeBusiness, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", employee.business_id)
          .maybeSingle();

        if (businessError) {
          console.error("❌ [SUBSCRIPTION MIDDLEWARE] Error finding employee's business:", businessError);
        }

        business = employeeBusiness;
        console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Employee's business:", business ? "✅ Found" : "❌ Not found");
      }
    }

    if (!business) {
      console.log("❌ [SUBSCRIPTION MIDDLEWARE] No business found - redirecting to setup");
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    console.log("✅ [SUBSCRIPTION MIDDLEWARE] Business found:", business.id, business.name);

    // Check if business is active
    if (!business.is_active) {
      console.log("❌ [SUBSCRIPTION MIDDLEWARE] Business is not active - redirecting");
      return {
        redirect: {
          destination: "/suspended",
          permanent: false,
        },
      };
    }

    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Getting subscription...");
    // Get active subscription
    const subscription = await subscriptionService.getActiveSubscription(business.id);
    console.log("🔍 [SUBSCRIPTION MIDDLEWARE] Subscription:", subscription ? "✅ Found" : "❌ Not found");

    if (!subscription) {
      console.log("❌ [SUBSCRIPTION MIDDLEWARE] No subscription - redirecting");
      return {
        redirect: {
          destination: "/subscription",
          permanent: false,
        },
      };
    }

    console.log("✅ [SUBSCRIPTION MIDDLEWARE] Subscription status:", subscription.status);

    // Check subscription status
    if (subscription.status === "canceled" || subscription.status === "past_due") {
      console.log("❌ [SUBSCRIPTION MIDDLEWARE] Subscription canceled/past_due - redirecting");
      return {
        redirect: {
          destination: "/subscription",
          permanent: false,
        },
      };
    }

    // Check if trial has expired
    if (subscription.status === "trialing" && subscription.trial_end) {
      const trialEndsAt = new Date(subscription.trial_end);
      const now = new Date();

      if (now > trialEndsAt) {
        console.log("❌ [SUBSCRIPTION MIDDLEWARE] Trial expired - redirecting");
        return {
          redirect: {
            destination: "/subscription",
            permanent: false,
          },
        };
      }
    }

    console.log("✅ [SUBSCRIPTION MIDDLEWARE] All checks passed!");
    return {
      props: {
        user: session.user,
        business,
        subscription,
      },
    };
  } catch (error) {
    console.error("💥 [SUBSCRIPTION MIDDLEWARE] Unexpected error:", error);
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}