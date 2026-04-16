import { GetServerSidePropsContext } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";

export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  console.log("🔍 [SERVER MIDDLEWARE] Starting subscription check...");
  
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient<Database>(context);
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log("❌ [SERVER MIDDLEWARE] No session - redirecting to login");
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    console.log("✅ [SERVER MIDDLEWARE] User found:", session.user.id);

    // Find business where user is owner
    const { data: ownedBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    let business = ownedBusiness;

    // If not owner, check if employee
    if (!business) {
      const { data: employee } = await supabase
        .from("employees")
        .select("business_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employee) {
        const { data: employeeBusiness } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", employee.business_id)
          .maybeSingle();

        business = employeeBusiness;
      }
    }

    if (!business) {
      console.log("❌ [SERVER MIDDLEWARE] No business found - redirecting to home");
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    console.log("✅ [SERVER MIDDLEWARE] Business found:", business.id, business.name);

    // Check if business is active
    if (!business.is_active) {
      console.log("❌ [SERVER MIDDLEWARE] Business inactive - redirecting");
      return {
        redirect: {
          destination: "/suspended",
          permanent: false,
        },
      };
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle();

    if (!subscription) {
      console.log("❌ [SERVER MIDDLEWARE] No subscription - redirecting");
      return {
        redirect: {
          destination: "/subscription",
          permanent: false,
        },
      };
    }

    console.log("✅ [SERVER MIDDLEWARE] Subscription found:", subscription.status);

    // Check subscription status
    if (subscription.status === "canceled" || subscription.status === "past_due") {
      console.log("❌ [SERVER MIDDLEWARE] Subscription invalid - redirecting");
      return {
        redirect: {
          destination: "/subscription",
          permanent: false,
        },
      };
    }

    // Check trial expiration
    if (subscription.status === "trialing" && subscription.trial_end) {
      const trialEndsAt = new Date(subscription.trial_end);
      const now = new Date();

      if (now > trialEndsAt) {
        console.log("❌ [SERVER MIDDLEWARE] Trial expired - redirecting");
        return {
          redirect: {
            destination: "/subscription",
            permanent: false,
          },
        };
      }
    }

    console.log("✅ [SERVER MIDDLEWARE] All checks passed!");

    return {
      props: {
        user: session.user,
        business,
        subscription,
      },
    };
  } catch (error) {
    console.error("💥 [SERVER MIDDLEWARE] Error:", error);
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}