-- Crear políticas RLS para product_variants
CREATE POLICY "users_can_view_variants_of_own_products"
ON product_variants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_variants.product_id
  )
);

CREATE POLICY "users_can_create_variants_for_own_products"
ON product_variants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_variants.product_id
  )
);

CREATE POLICY "users_can_update_variants_of_own_products"
ON product_variants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_variants.product_id
  )
);

CREATE POLICY "users_can_delete_variants_of_own_products"
ON product_variants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_variants.product_id
  )
);