-- Crear políticas RLS para sale_payments
CREATE POLICY "users_can_view_payments_of_own_business"
  ON sale_payments FOR SELECT
  USING (
    sale_id IN (
      SELECT s.id
      FROM sales s
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_create_payments_in_own_business"
  ON sale_payments FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT s.id
      FROM sales s
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_update_payments_of_own_business"
  ON sale_payments FOR UPDATE
  USING (
    sale_id IN (
      SELECT s.id
      FROM sales s
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "users_can_delete_payments_of_own_business"
  ON sale_payments FOR DELETE
  USING (
    sale_id IN (
      SELECT s.id
      FROM sales s
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );