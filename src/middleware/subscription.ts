import { GetServerSidePropsContext } from "next";
import { getCurrentSession } from "@/services/authService";
import { getBusinessByOwnerId } from "@/services/businessService";
import { getActiveSubscription } from "@/services/subscriptionService";

export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  try {
    // Check auth first
    const { data: session, error: authError } = await getCurrentSession();

    if (authError || !session?.user) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    // Get user's business
    const { data: business, error: businessError } = await getBusinessByOwnerId(session.user.id);

    if (businessError || !business) {
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
    const { data: subscription, error: subscriptionError } = await getActiveSubscription(business.id);

    if (subscriptionError || !subscription) {
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
    if (subscription.status === "trialing" && subscription.trial_ends_at) {
      const trialEndsAt = new Date(subscription.trial_ends_at);
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
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}