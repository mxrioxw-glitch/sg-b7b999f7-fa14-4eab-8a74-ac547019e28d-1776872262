-- Políticas para payment_methods
CREATE POLICY "users_can_view_payment_methods"
  ON payment_methods FOR SELECT
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_payment_methods"
  ON payment_methods FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_payment_methods"
  ON payment_methods FOR UPDATE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_payment_methods"
  ON payment_methods FOR DELETE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );