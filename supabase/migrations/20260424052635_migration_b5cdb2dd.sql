-- Crear políticas RLS para categories
CREATE POLICY "users_can_view_categories_of_own_business"
ON categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = categories.business_id
  )
);

CREATE POLICY "users_can_create_categories_for_own_business"
ON categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = categories.business_id
  )
);

CREATE POLICY "users_can_update_categories_of_own_business"
ON categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = categories.business_id
  )
);

CREATE POLICY "users_can_delete_categories_of_own_business"
ON categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.user_id = auth.uid()
    AND b.id = categories.business_id
  )
);

-- Super admins pueden ver todas las categorías
CREATE POLICY "super_admins_can_view_all_categories"
ON categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);