-- Crear políticas RLS para products
-- Permitir a usuarios ver productos de su propio negocio (via employees)
CREATE POLICY "users_can_view_products_of_own_business"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = products.business_id
  )
);

CREATE POLICY "users_can_create_products_for_own_business"
ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = products.business_id
  )
);

CREATE POLICY "users_can_update_products_of_own_business"
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = products.business_id
  )
);

CREATE POLICY "users_can_delete_products_of_own_business"
ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = products.business_id
  )
);

-- Super admins pueden ver todos los productos
CREATE POLICY "super_admins_can_view_all_products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);