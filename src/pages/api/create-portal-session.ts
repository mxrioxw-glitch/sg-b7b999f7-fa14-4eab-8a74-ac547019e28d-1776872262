import type { NextApiRequest, NextApiResponse } from "next";
import { createCustomerPortalSession } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Missing businessId" });
    }

    // Obtener customer ID de Stripe
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("business_id", businessId)
      .single();

    if (error || !subscription?.stripe_customer_id) {
      return res.status(400).json({ 
        error: "No se encontró información de pago para este negocio" 
      });
    }

    // Crear sesión del portal
    const session = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/subscription`
    );

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({ error: error.message });
  }
}