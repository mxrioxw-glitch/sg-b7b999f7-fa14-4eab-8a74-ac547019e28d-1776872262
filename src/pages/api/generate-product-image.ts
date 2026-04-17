import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { productName, businessId } = req.body;

    if (!productName || !businessId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." 
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-quality, professional product photo of ${productName}. Clean white background, well-lit, commercial photography style, appetizing presentation.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${productName.toLowerCase().replace(/\s+/g, "-")}.png`;
    const filePath = `${businessId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return res.status(200).json({
      url: publicUrl,
      path: filePath,
    });

  } catch (error: any) {
    console.error("Error generating AI image:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate image" 
    });
  }
}