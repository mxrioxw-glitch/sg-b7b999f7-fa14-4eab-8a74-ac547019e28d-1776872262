import { supabase } from "@/integrations/supabase/client";

export const storageService = {
  /**
   * Upload an image file to Supabase Storage
   */
  async uploadProductImage(file: File, businessId: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${businessId}/${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
  },

  /**
   * Delete an image from Supabase Storage
   */
  async deleteProductImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Generate an AI image using a product name/description
   */
  async generateAIImage(productName: string, businessId: string): Promise<{ url: string; path: string }> {
    try {
      // Call our Edge Function to generate the image
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: { 
          prompt: `Professional product photo of ${productName}, high quality, well lit, clean background, commercial photography style`,
          businessId 
        }
      });

      if (error) throw error;

      return { url: data.url, path: data.path };
    } catch (error) {
      console.error('Error generating AI image:', error);
      throw error;
    }
  }
};