import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;
export type ProductExtra = Tables<"product_extras">;

export interface ProductWithDetails extends Product {
  variants?: ProductVariant[];
  extras?: ProductExtra[];
  category?: { name: string } | null;
}

export const productService = {
  async getProducts(businessId: string): Promise<ProductWithDetails[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name),
        variants:product_variants(*),
        extras:product_extras(*)
      `)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return (data || []).map(product => ({
      ...product,
      variants: Array.isArray(product.variants) ? product.variants.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
      extras: Array.isArray(product.extras) ? product.extras.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
    }));
  },

  async getProductsByCategory(
    businessId: string,
    categoryId: string
  ): Promise<ProductWithDetails[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name),
        variants:product_variants(*),
        extras:product_extras(*)
      `)
      .eq("business_id", businessId)
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }

    return (data || []).map(product => ({
      ...product,
      variants: Array.isArray(product.variants) ? product.variants.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
      extras: Array.isArray(product.extras) ? product.extras.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
    }));
  },

  async createProduct(
    businessId: string,
    productData: {
      category_id?: string;
      name: string;
      description?: string;
      base_price: number;
      image_url?: string;
      has_variants?: boolean;
      has_extras?: boolean;
    }
  ): Promise<{ product: Product | null; error: string | null }> {
    const { data, error } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        category_id: productData.category_id,
        name: productData.name,
        description: productData.description,
        base_price: productData.base_price,
        image_url: productData.image_url,
        has_variants: productData.has_variants ?? false,
        has_extras: productData.has_extras ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return { product: null, error: error.message };
    }

    return { product: data, error: null };
  },

  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; error: string | null }> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return { product: null, error: error.message };
    }

    return { product: data, error: null };
  },

  async deleteProduct(productId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  async createVariant(
    productId: string,
    variantData: {
      name: string;
      price_modifier: number;
      sort_order?: number;
    }
  ): Promise<{ variant: ProductVariant | null; error: string | null }> {
    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name: variantData.name,
        price_modifier: variantData.price_modifier,
        sort_order: variantData.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating variant:", error);
      return { variant: null, error: error.message };
    }

    return { variant: data, error: null };
  },

  async createExtra(
    productId: string,
    extraData: {
      name: string;
      price: number;
      sort_order?: number;
    }
  ): Promise<{ extra: ProductExtra | null; error: string | null }> {
    const { data, error } = await supabase
      .from("product_extras")
      .insert({
        product_id: productId,
        name: extraData.name,
        price: extraData.price,
        sort_order: extraData.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating extra:", error);
      return { extra: null, error: error.message };
    }

    return { extra: data, error: null };
  },
};