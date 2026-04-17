import Stripe from "stripe";

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default stripe;

// Configuración de precios y productos
export const STRIPE_PLANS = {
  basic: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || "",
    name: "Plan Básico",
    interval: "month" as const,
  },
  professional: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || "",
    name: "Plan Profesional",
    interval: "month" as const,
  },
  premium: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || "",
    name: "Plan Premium",
    interval: "month" as const,
  },
};

// Crear sesión de checkout
export async function createCheckoutSession(
  priceId: string,
  customerId: string | null,
  businessId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId || undefined,
    customer_email: customerId ? undefined : undefined,
    metadata: {
      businessId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        businessId,
      },
    },
  });

  return session;
}

// Crear portal del cliente
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Obtener suscripción
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Cancelar suscripción
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}