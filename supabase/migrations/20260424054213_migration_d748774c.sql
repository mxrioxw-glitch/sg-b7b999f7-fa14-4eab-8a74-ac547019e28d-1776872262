-- Crear políticas RLS para inventory_items
CREATE POLICY "users_can_view_inventory_of_own_business" ON inventory_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.business_id = inventory_items.business_id
    AND employees.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

CREATE POLICY "users_can_insert_inventory_of_own_business" ON inventory_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.business_id = inventory_items.business_id
    AND employees.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

CREATE POLICY "users_can_update_inventory_of_own_business" ON inventory_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.business_id = inventory_items.business_id
    AND employees.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

CREATE POLICY "users_can_delete_inventory_of_own_business" ON inventory_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.business_id = inventory_items.business_id
    AND employees.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);