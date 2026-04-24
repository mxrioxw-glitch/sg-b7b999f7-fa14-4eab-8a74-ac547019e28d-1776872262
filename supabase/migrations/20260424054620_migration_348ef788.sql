-- Crear políticas RLS para sales
CREATE POLICY "users_can_view_sales_of_own_business"
  ON sales FOR SELECT
  USING (
    business_id IN (
      SELECT e.business_id
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_create_sales_in_own_business"
  ON sales FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT e.business_id
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_update_sales_of_own_business"
  ON sales FOR UPDATE
  USING (
    business_id IN (
      SELECT e.business_id
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_delete_sales_of_own_business"
  ON sales FOR DELETE
  USING (
    business_id IN (
      SELECT e.business_id
      FROM employees e
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );