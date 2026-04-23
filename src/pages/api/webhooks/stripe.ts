import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { supabase } from "@/integrations/supabase/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const businessId = session.metadata?.businessId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!businessId) {
    console.error("Missing businessId in checkout session");
    return;
  }

  // Obtener detalles de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Determinar el tipo de plan según el priceId
  let planType: "basic" | "professional" | "premium" = "basic";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL) {
    planType = "professional";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) {
    planType = "premium";
  }

  // Actualizar suscripción en la base de datos
  await supabase
    .from("subscriptions")
    .update({
      status: "active" as const,
      plan: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("business_id", businessId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    console.error("Missing businessId in subscription");
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  let planType: "basic" | "professional" | "premium" = "basic";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL) {
    planType = "professional";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) {
    planType = "premium";
  }

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status === "active" ? ("active" as const) : ("canceled" as const),
      plan: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("business_id", businessId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    console.error("Missing businessId in subscription");
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled" as const,
      current_period_end: new Date().toISOString(),
    })
    .eq("business_id", businessId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const businessId = subscription.metadata?.businessId;

  if (!businessId) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "active" as const,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("business_id", businessId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const businessId = subscription.metadata?.businessId;

  if (!businessId) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due" as const,
    })
    .eq("business_id", businessId);
}