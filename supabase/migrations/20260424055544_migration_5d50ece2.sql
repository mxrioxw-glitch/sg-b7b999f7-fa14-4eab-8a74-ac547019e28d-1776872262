-- Políticas para employee_permissions
CREATE POLICY "users_can_view_employee_permissions"
  ON employee_permissions FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id 
      FROM employees e
      WHERE e.user_id = auth.uid()
      OR e.business_id IN (
        SELECT e2.business_id 
        FROM employees e2 
        WHERE e2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "users_can_insert_employee_permissions"
  ON employee_permissions FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id 
      FROM employees e
      JOIN employees e2 ON e2.business_id = e.business_id
      WHERE e2.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_employee_permissions"
  ON employee_permissions FOR UPDATE
  USING (
    employee_id IN (
      SELECT e.id 
      FROM employees e
      JOIN employees e2 ON e2.business_id = e.business_id
      WHERE e2.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_employee_permissions"
  ON employee_permissions FOR DELETE
  USING (
    employee_id IN (
      SELECT e.id 
      FROM employees e
      JOIN employees e2 ON e2.business_id = e.business_id
      WHERE e2.user_id = auth.uid()
    )
  );