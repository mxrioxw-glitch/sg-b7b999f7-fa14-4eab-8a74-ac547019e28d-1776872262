-- Políticas para cash_registers
CREATE POLICY "users_can_view_cash_registers_of_own_business"
  ON cash_registers FOR SELECT
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_cash_registers_of_own_business"
  ON cash_registers FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_cash_registers_of_own_business"
  ON cash_registers FOR UPDATE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_cash_registers_of_own_business"
  ON cash_registers FOR DELETE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );