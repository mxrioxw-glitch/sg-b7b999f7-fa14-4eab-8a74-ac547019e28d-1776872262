import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;

export const categoryService = {
  async getCategories(businessId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data || [];
  },

  async createCategory(
    businessId: string,
    categoryData: {
      name: string;
      description?: string;
      icon?: string;
      sort_order?: number;
    }
  ): Promise<{ category: Category | null; error: string | null }> {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        business_id: businessId,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        sort_order: categoryData.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return { category: null, error: error.message };
    }

    return { category: data, error: null };
  },

  async updateCategory(
    categoryId: string,
    updates: Partial<Category>
  ): Promise<{ category: Category | null; error: string | null }> {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", categoryId)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return { category: null, error: error.message };
    }

    return { category: data, error: null };
  },

  async deleteCategory(categoryId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      console.error("Error deleting category:", error);
      return { error: error.message };
    }

    return { error: null };
  },
};