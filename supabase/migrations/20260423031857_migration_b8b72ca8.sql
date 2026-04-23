-- POLÍTICAS RLS PARA TODAS LAS TABLAS

-- CATEGORIES
CREATE POLICY "Users can view their business categories" ON categories
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business categories" ON categories
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business categories" ON categories
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their business categories" ON categories
  FOR DELETE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- PRODUCTS
CREATE POLICY "Users can view their business products" ON products
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business products" ON products
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business products" ON products
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their business products" ON products
  FOR DELETE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- INVENTORY ITEMS
CREATE POLICY "Users can view their business inventory" ON inventory_items
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business inventory" ON inventory_items
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their business inventory" ON inventory_items
  FOR DELETE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- INVENTORY ADJUSTMENTS
CREATE POLICY "Users can view their business adjustments" ON inventory_adjustments
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business adjustments" ON inventory_adjustments
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- CUSTOMERS
CREATE POLICY "Users can view their business customers" ON customers
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business customers" ON customers
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business customers" ON customers
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their business customers" ON customers
  FOR DELETE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- PAYMENT METHODS
CREATE POLICY "Users can view their business payment methods" ON payment_methods
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business payment methods" ON payment_methods
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business payment methods" ON payment_methods
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can delete their business payment methods" ON payment_methods
  FOR DELETE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- CASH REGISTERS
CREATE POLICY "Users can view their business cash registers" ON cash_registers
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business cash registers" ON cash_registers
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business cash registers" ON cash_registers
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- SALES
CREATE POLICY "Users can view their business sales" ON sales
  FOR SELECT USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can insert their business sales" ON sales
  FOR INSERT WITH CHECK (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

CREATE POLICY "Users can update their business sales" ON sales
  FOR UPDATE USING (
    business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
  );

-- SALE ITEMS
CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert sale items" ON sale_items
  FOR INSERT WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
    )
  );

-- SALE PAYMENTS
CREATE POLICY "Users can view sale payments" ON sale_payments
  FOR SELECT USING (
    sale_id IN (
      SELECT id FROM sales WHERE business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert sale payments" ON sale_payments
  FOR INSERT WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE business_id IN (SELECT * FROM get_user_business_ids(auth.uid()))
    )
  );