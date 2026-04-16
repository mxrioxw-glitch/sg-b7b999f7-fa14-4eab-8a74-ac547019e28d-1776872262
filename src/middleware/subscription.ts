import { GetServerSidePropsContext } from "next";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";

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

    // Get user's business (works for both owners and employees)
    const business = await businessService.getCurrentBusiness();

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
    const subscription = await subscriptionService.getActiveSubscription(business.id);

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