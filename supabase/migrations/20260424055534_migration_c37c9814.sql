-- Políticas para product_inventory_items
CREATE POLICY "users_can_view_product_inventory_items"
  ON product_inventory_items FOR SELECT
  USING (
    product_id IN (
      SELECT p.id 
      FROM products p
      JOIN employees e ON e.business_id = p.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_product_inventory_items"
  ON product_inventory_items FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT p.id 
      FROM products p
      JOIN employees e ON e.business_id = p.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_product_inventory_items"
  ON product_inventory_items FOR UPDATE
  USING (
    product_id IN (
      SELECT p.id 
      FROM products p
      JOIN employees e ON e.business_id = p.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_product_inventory_items"
  ON product_inventory_items FOR DELETE
  USING (
    product_id IN (
      SELECT p.id 
      FROM products p
      JOIN employees e ON e.business_id = p.business_id
      WHERE e.user_id = auth.uid()
    )
  );