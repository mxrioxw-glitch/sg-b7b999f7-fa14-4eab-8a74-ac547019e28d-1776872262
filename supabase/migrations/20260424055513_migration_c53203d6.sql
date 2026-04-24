-- Políticas para inventory_movements
CREATE POLICY "users_can_view_inventory_movements"
  ON inventory_movements FOR SELECT
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_inventory_movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_inventory_movements"
  ON inventory_movements FOR UPDATE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_inventory_movements"
  ON inventory_movements FOR DELETE
  USING (
    business_id IN (
      SELECT e.business_id 
      FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );