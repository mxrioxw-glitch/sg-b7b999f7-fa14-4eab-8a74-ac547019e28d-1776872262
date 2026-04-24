-- Crear políticas RLS para customers
CREATE POLICY "users_can_view_customers_of_own_business" ON customers
  FOR SELECT
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_insert_customers_in_own_business" ON customers
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT e.business_id 
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_update_customers_in_own_business" ON customers
  FOR UPDATE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_delete_customers_in_own_business" ON customers
  FOR DELETE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );