-- ============================================
-- 1. BUSINESSES (Multi-tenant core)
-- ============================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_included BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'MXN',
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. SUBSCRIPTIONS
-- ============================================
CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'expired');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'basic',
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. EMPLOYEES (Users with roles per business)
-- ============================================
CREATE TYPE employee_role AS ENUM ('owner', 'admin', 'cashier');

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role employee_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ============================================
-- 4. CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  has_variants BOOLEAN DEFAULT false,
  has_extras BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. PRODUCT VARIANTS (Sizes, etc)
-- ============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. PRODUCT EXTRAS (Modifiers)
-- ============================================
CREATE TABLE product_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. INVENTORY ITEMS (Insumos/Raw materials)
-- ============================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. PAYMENT METHODS
-- ============================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. CASH REGISTERS (Cortes de caja)
-- ============================================
CREATE TYPE cash_register_status AS ENUM ('open', 'closed');

CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  status cash_register_status NOT NULL DEFAULT 'open',
  opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  difference DECIMAL(10,2),
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. SALES
-- ============================================
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'canceled');

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
  status sale_status NOT NULL DEFAULT 'completed',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. SALE ITEMS
-- ============================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. SALE ITEM EXTRAS (Extras applied to sale items)
-- ============================================
CREATE TABLE sale_item_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
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

-- ============================================
-- RLS POLICIES - Multi-tenant isolation
-- ============================================

-- Helper function to get user's business IDs
CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid UUID)
RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT e.business_id
  FROM employees e
  WHERE e.user_id = user_uuid AND e.is_active = true
  UNION
  SELECT b.id
  FROM businesses b
  WHERE b.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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