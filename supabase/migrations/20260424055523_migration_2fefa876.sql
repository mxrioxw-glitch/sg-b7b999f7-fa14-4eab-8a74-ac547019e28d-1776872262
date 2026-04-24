-- Políticas para sale_item_extras
CREATE POLICY "users_can_view_sale_item_extras"
  ON sale_item_extras FOR SELECT
  USING (
    sale_item_id IN (
      SELECT si.id 
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_insert_sale_item_extras"
  ON sale_item_extras FOR INSERT
  WITH CHECK (
    sale_item_id IN (
      SELECT si.id 
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_sale_item_extras"
  ON sale_item_extras FOR UPDATE
  USING (
    sale_item_id IN (
      SELECT si.id 
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_sale_item_extras"
  ON sale_item_extras FOR DELETE
  USING (
    sale_item_id IN (
      SELECT si.id 
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN employees e ON e.business_id = s.business_id
      WHERE e.user_id = auth.uid()
    )
  );