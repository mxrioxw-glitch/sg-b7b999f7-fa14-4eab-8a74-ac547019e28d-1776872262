import { GetServerSidePropsContext } from "next";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  try {
    // Check auth first
    const session = await authService.getCurrentSession();

    if (!session?.user) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    // Get user's business (check both as owner and as employee)
    let business = null;

    // First try as owner
    const { data: ownedBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (ownedBusiness) {
      business = ownedBusiness;
    } else {
      // If not owner, check if user is an employee
      const { data: employee } = await supabase
        .from("employees")
        .select("business_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employee) {
        // Get the business for this employee
        const { data: employeeBusiness } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", employee.business_id)
          .maybeSingle();

        business = employeeBusiness;
      }
    }

    if (!business) {
      return {
        redirect: {
          destination: "/setup",
          permanent: false,
        },
      };
    }

    // Check if business is active
    if (!business.is_active) {
      return {
        redirect: {
          destination: "/suspended",
          permanent: false,
        },
      };
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!subscription) {
      return {
        redirect: {
          destination: "/subscription/expired",
          permanent: false,
        },
      };
    }

    // Check subscription status
    if (subscription.status === "canceled" || subscription.status === "past_due") {
      return {
        redirect: {
          destination: "/subscription/expired",
          permanent: false,
        },
      };
    }

    // Check if trial has expired
    if (subscription.status === "trialing" && subscription.trial_end) {
      const trialEndsAt = new Date(subscription.trial_end);
      const now = new Date();

      if (now > trialEndsAt) {
        return {
          redirect: {
            destination: "/subscription/expired",
            permanent: false,
          },
        };
      }
    }

    return {
      props: {
        user: session.user,
        business,
        subscription,
      },
    };
  } catch (error) {
    console.error("Error in requireActiveSubscription:", error);
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}