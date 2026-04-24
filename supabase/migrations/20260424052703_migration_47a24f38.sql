-- Crear políticas RLS para product_extras
CREATE POLICY "users_can_view_extras_of_own_products"
ON product_extras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_extras.product_id
  )
);

CREATE POLICY "users_can_create_extras_for_own_products"
ON product_extras FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_extras.product_id
  )
);

CREATE POLICY "users_can_update_extras_of_own_products"
ON product_extras FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_extras.product_id
  )
);

CREATE POLICY "users_can_delete_extras_of_own_products"
ON product_extras FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN employees e ON e.business_id = p.business_id
    WHERE e.user_id = auth.uid()
    AND p.id = product_extras.product_id
  )
);