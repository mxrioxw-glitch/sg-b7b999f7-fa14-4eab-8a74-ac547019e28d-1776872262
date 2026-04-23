-- RECREAR ÍNDICES
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_employees_business ON employees(business_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_categories_business ON categories(business_id);
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_extras_product ON product_extras(product_id);
CREATE INDEX idx_inventory_business ON inventory_items(business_id);
CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_payment_methods_business ON payment_methods(business_id);
CREATE INDEX idx_cash_registers_business ON cash_registers(business_id);
CREATE INDEX idx_sales_business ON sales(business_id);
CREATE INDEX idx_sales_employee ON sales(employee_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_item_extras_item ON sale_item_extras(sale_item_id);

-- RECREAR POLÍTICAS RLS

-- BUSINESSES
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own businesses" ON businesses FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Users can create their own businesses" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their businesses" ON businesses FOR UPDATE USING (owner_id = auth.uid());

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View subscriptions for user's businesses" ON subscriptions FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- EMPLOYEES
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View employees in user's businesses" ON employees FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Owners can manage employees" ON employees FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View categories in user's businesses" ON categories FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage categories in user's businesses" ON categories FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View products in user's businesses" ON products FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage products in user's businesses" ON products FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- PRODUCT VARIANTS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View variants in user's products" ON product_variants FOR SELECT USING (
  product_id IN (SELECT id FROM products WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);
CREATE POLICY "Manage variants in user's products" ON product_variants FOR ALL USING (
  product_id IN (SELECT id FROM products WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);

-- PRODUCT EXTRAS
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View extras in user's products" ON product_extras FOR SELECT USING (
  product_id IN (SELECT id FROM products WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);
CREATE POLICY "Manage extras in user's products" ON product_extras FOR ALL USING (
  product_id IN (SELECT id FROM products WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);

-- INVENTORY ITEMS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View inventory in user's businesses" ON inventory_items FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage inventory in user's businesses" ON inventory_items FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View customers in user's businesses" ON customers FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage customers in user's businesses" ON customers FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- PAYMENT METHODS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View payment methods in user's businesses" ON payment_methods FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage payment methods in user's businesses" ON payment_methods FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- CASH REGISTERS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cash registers in user's businesses" ON cash_registers FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Manage cash registers in user's businesses" ON cash_registers FOR ALL USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View sales in user's businesses" ON sales FOR SELECT USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Create sales in user's businesses" ON sales FOR INSERT WITH CHECK (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);
CREATE POLICY "Update sales in user's businesses" ON sales FOR UPDATE USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- SALE ITEMS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View sale items for user's sales" ON sale_items FOR SELECT USING (
  sale_id IN (SELECT id FROM sales WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);
CREATE POLICY "Manage sale items for user's sales" ON sale_items FOR ALL USING (
  sale_id IN (SELECT id FROM sales WHERE business_id IN (SELECT get_user_business_ids(auth.uid())))
);

-- SALE ITEM EXTRAS
ALTER TABLE sale_item_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View sale item extras" ON sale_item_extras FOR SELECT USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.business_id IN (SELECT get_user_business_ids(auth.uid()))
  )
);
CREATE POLICY "Manage sale item extras" ON sale_item_extras FOR ALL USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.business_id IN (SELECT get_user_business_ids(auth.uid()))
  )
);

-- NOTIFICAR A POSTGREST
NOTIFY pgrst, 'reload schema';