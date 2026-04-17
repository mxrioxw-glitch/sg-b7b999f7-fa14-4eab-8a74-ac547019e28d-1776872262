import type { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId, businessId } = req.body;

    if (!priceId || !businessId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Obtener o crear customer en Stripe
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("business_id", businessId)
      .single();

    const customerId = subscription?.stripe_customer_id || null;

    // Crear sesión de checkout
    const session = await createCheckoutSession(
      priceId,
      customerId,
      businessId,
      `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`
    );

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ error: error.message });
  }
}