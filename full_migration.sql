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

-- Make owner_id nullable temporarily for demo business
ALTER TABLE businesses ALTER COLUMN owner_id DROP NOT NULL;

-- Delete existing demo data to start fresh
DELETE FROM product_extras WHERE product_id IN (
  SELECT id FROM products WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid
);
DELETE FROM product_variants WHERE product_id IN (
  SELECT id FROM products WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid
);
DELETE FROM products WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM categories WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM subscriptions WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM businesses WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Create demo business without owner (public demo)
INSERT INTO businesses (id, name, slug, tax_rate, tax_included, is_active, owner_id)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Café Demo',
  'cafe-demo',
  16,
  false,
  true,
  NULL
);

-- Create subscription for demo business
INSERT INTO subscriptions (business_id, plan, status, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'premium',
  'trialing',
  NOW(),
  NOW() + INTERVAL '30 days'
);

-- Add public read policy for demo business categories
DROP POLICY IF EXISTS "public_read_demo_categories" ON categories;
CREATE POLICY "public_read_demo_categories" ON categories
  FOR SELECT
  USING (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Add public read policy for demo business products
DROP POLICY IF EXISTS "public_read_demo_products" ON products;
CREATE POLICY "public_read_demo_products" ON products
  FOR SELECT
  USING (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Add public read policy for demo product variants
DROP POLICY IF EXISTS "public_read_demo_variants" ON product_variants;
CREATE POLICY "public_read_demo_variants" ON product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.business_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

-- Add public read policy for demo product extras
DROP POLICY IF EXISTS "public_read_demo_extras" ON product_extras;
CREATE POLICY "public_read_demo_extras" ON product_extras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_extras.product_id 
      AND products.business_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

-- Insert demo categories
INSERT INTO categories (id, business_id, name, description, icon, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Bebidas Calientes', 'Cafés, tés y bebidas calientes', '☕', 1),
  ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Bebidas Frías', 'Smoothies, frappes y bebidas heladas', '🧊', 2),
  ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Panadería', 'Pan dulce, croissants y muffins', '🥐', 3),
  ('10000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Alimentos', 'Sandwiches, ensaladas y platillos', '🥗', 4);

-- Insert demo products with real cafe images
INSERT INTO products (id, business_id, category_id, name, description, base_price, image_url, is_active, has_variants, has_extras) VALUES
  ('20000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Café Americano', 'Café espresso con agua caliente', 35.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true, true, true),
  ('20000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Latte', 'Espresso con leche vaporizada', 45.00, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', true, true, true),
  ('20000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Cappuccino', 'Espresso con espuma de leche', 42.00, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', true, true, true),
  ('20000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Mocha', 'Latte con chocolate', 50.00, 'https://images.unsplash.com/photo-1607260550778-aa4d18b209f6?w=400', true, true, true),
  ('20000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Frappe de Caramelo', 'Café helado con caramelo', 55.00, 'https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400', true, true, true),
  ('20000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Croissant', 'Croissant de mantequilla', 35.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, false, false),
  ('20000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Muffin de Arándanos', 'Muffin con arándanos frescos', 40.00, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', true, false, false),
  ('20000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, 'Sandwich Jamón y Queso', 'Sandwich clásico con jamón y queso', 65.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true, false, false),
  ('20000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, 'Ensalada César', 'Ensalada con pollo y aderezo césar', 85.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, false, true);

-- Insert product variants (sizes for drinks)
INSERT INTO product_variants (id, product_id, name, price_modifier, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Chico', 0, 1),
  ('30000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Mediano', 10, 2),
  ('30000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Grande', 20, 3),
  ('30000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Chico', 0, 1),
  ('30000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Mediano', 10, 2),
  ('30000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Grande', 20, 3),
  ('30000000-0000-0000-0000-000000000007'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Chico', 0, 1),
  ('30000000-0000-0000-0000-000000000008'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Mediano', 10, 2),
  ('30000000-0000-0000-0000-000000000009'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Chico', 0, 1),
  ('30000000-0000-0000-0000-000000000010'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Mediano', 10, 2),
  ('30000000-0000-0000-0000-000000000011'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Grande', 20, 3),
  ('30000000-0000-0000-0000-000000000012'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, 'Mediano', 0, 1),
  ('30000000-0000-0000-0000-000000000013'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, 'Grande', 15, 2);

-- Insert product extras (add-ons)
INSERT INTO product_extras (id, product_id, name, price, sort_order) VALUES
  ('40000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Shot Extra', 15, 1),
  ('40000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Vainilla', 10, 2),
  ('40000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Caramelo', 10, 3),
  ('40000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Leche de Avena', 15, 1),
  ('40000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Leche de Almendra', 15, 2),
  ('40000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Vainilla', 10, 3),
  ('40000000-0000-0000-0000-000000000007'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Shot Extra', 15, 4),
  ('40000000-0000-0000-0000-000000000008'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Canela', 5, 1),
  ('40000000-0000-0000-0000-000000000009'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Chocolate', 10, 2),
  ('40000000-0000-0000-0000-000000000010'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Shot Extra', 15, 3),
  ('40000000-0000-0000-0000-000000000011'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Extra Chocolate', 10, 1),
  ('40000000-0000-0000-0000-000000000012'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Crema Batida', 12, 2),
  ('40000000-0000-0000-0000-000000000013'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, 'Shot Extra', 15, 3),
  ('40000000-0000-0000-0000-000000000014'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, 'Crema Batida', 12, 1),
  ('40000000-0000-0000-0000-000000000015'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, 'Extra Caramelo', 10, 2),
  ('40000000-0000-0000-0000-000000000016'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, 'Shot Extra', 15, 3),
  ('40000000-0000-0000-0000-000000000017'::uuid, '20000000-0000-0000-0000-000000000009'::uuid, 'Pollo Extra', 25, 1),
  ('40000000-0000-0000-0000-000000000018'::uuid, '20000000-0000-0000-0000-000000000009'::uuid, 'Aguacate', 20, 2),
  ('40000000-0000-0000-0000-000000000019'::uuid, '20000000-0000-0000-0000-000000000009'::uuid, 'Crutones', 8, 3);

-- Create inventory_movements table for kardex tracking
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase', 'adjustment', 'production')),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_business ON inventory_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

-- RLS policies
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business inventory movements" ON inventory_movements
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inventory movements for their business" ON inventory_movements
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Create product_inventory_items junction table for linking products to inventory
CREATE TABLE IF NOT EXISTS product_inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_per_unit DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, inventory_item_id)
);

-- RLS for product_inventory_items
ALTER TABLE product_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product inventory links" ON product_inventory_items
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM products WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage product inventory links" ON product_inventory_items
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Agregar campos de personalización a businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS pos_name text DEFAULT 'POS System',
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2A1810',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#4A3228',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#4A9C64';

-- Comentarios para documentación
COMMENT ON COLUMN businesses.pos_name IS 'Nombre personalizado del sistema POS';
COMMENT ON COLUMN businesses.primary_color IS 'Color primario del sistema (hex)';
COMMENT ON COLUMN businesses.secondary_color IS 'Color secundario del sistema (hex)';
COMMENT ON COLUMN businesses.accent_color IS 'Color de acento del sistema (hex)';

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Crear o reemplazar función para auto-crear perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger para auto-crear perfil cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 1. Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Crear o reemplazar la función que crea perfiles automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Crear el trigger que ejecuta la función cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: crear perfiles para usuarios existentes que no tienen perfil
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Create subscription_plans table to store configurable plan pricing
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY, -- 'basic', 'professional', 'premium'
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2) NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_branches integer NOT NULL DEFAULT 1,
  max_products integer NOT NULL DEFAULT 100,
  max_employees integer NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read plans (public data)
CREATE POLICY "public_read_plans" ON subscription_plans
  FOR SELECT USING (true);

-- Policy: Only super admin can update plans (we'll check this in the app)
CREATE POLICY "admin_update_plans" ON subscription_plans
  FOR UPDATE USING (true);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, features, max_branches, max_products, max_employees, sort_order)
VALUES 
  ('basic', 'Básico', 299, 2990, 
   '["1 sucursal", "100 productos", "2 empleados", "Reportes básicos", "Soporte por email"]'::jsonb, 
   1, 100, 2, 1),
  ('professional', 'Profesional', 599, 5990,
   '["3 sucursales", "Productos ilimitados", "5 empleados", "Reportes avanzados", "Multi-caja", "Soporte prioritario"]'::jsonb,
   3, 999999, 5, 2),
  ('premium', 'Premium', 999, 9990,
   '["Sucursales ilimitadas", "Productos ilimitados", "Empleados ilimitados", "Dashboard en tiempo real", "API acceso", "Soporte 24/7"]'::jsonb,
   999999, 999999, 999999, 3)
ON CONFLICT (id) DO NOTHING;

-- Add points configuration to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS generates_points BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS points_value INTEGER DEFAULT 0;

-- Update existing products to have default values
UPDATE products 
SET generates_points = false, points_value = 0 
WHERE generates_points IS NULL;

-- Add printer configuration to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS printer_width VARCHAR(10) DEFAULT '80mm';

COMMENT ON COLUMN businesses.printer_width IS 'Thermal printer paper width: 58mm or 80mm';

-- Update existing businesses to have default 80mm
UPDATE businesses 
SET printer_width = '80mm' 
WHERE printer_width IS NULL;

-- Create storage bucket for business logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for business logos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-logos');

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-logos');

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-logos');

-- Agregar columna variant_id a product_inventory_items para asociar insumos a variantes específicas
ALTER TABLE product_inventory_items 
ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento en búsquedas por variante
CREATE INDEX idx_product_inventory_items_variant_id 
ON product_inventory_items(variant_id);

COMMENT ON COLUMN product_inventory_items.variant_id IS 
'Si es NULL, el insumo aplica al producto base. Si tiene valor, el insumo solo aplica a esa variante específica (ej: vaso chico solo para café chico)';

-- Agregar políticas RLS para INSERT y UPDATE en subscriptions

-- Política para crear suscripciones (solo para negocios del usuario)
CREATE POLICY "Users can create subscriptions for their businesses"
ON subscriptions
FOR INSERT
TO public
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Política para actualizar suscripciones (solo para negocios del usuario)
CREATE POLICY "Users can update subscriptions for their businesses"
ON subscriptions
FOR UPDATE
TO public
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Eliminar TODAS las políticas actuales de subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "users_insert_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "users_update_own_subscription" ON subscriptions;

-- Crear políticas RLS simples y directas (patrón T1 - datos privados)
CREATE POLICY "select_own_business_subscription" ON subscriptions
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "insert_own_business_subscription" ON subscriptions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "update_own_business_subscription" ON subscriptions
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "delete_own_business_subscription" ON subscriptions
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- TEMPORAL: Crear políticas RLS MUY PERMISIVAS para diagnosticar el problema
-- Una vez que funcione, las haremos más restrictivas

-- Eliminar todas las políticas actuales
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Crear política TEMPORAL muy permisiva para SELECT (leer)
-- Permitir a cualquier usuario autenticado ver las suscripciones
CREATE POLICY "temp_select_all" ON subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Política TEMPORAL para INSERT (crear)
CREATE POLICY "temp_insert_all" ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política TEMPORAL para UPDATE (actualizar)
CREATE POLICY "temp_update_all" ON subscriptions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar que las políticas se crearon
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- LIMPIAR TODAS LAS POLÍTICAS DUPLICADAS
DROP POLICY IF EXISTS "Users can create subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "View subscriptions for user's businesses" ON subscriptions;
DROP POLICY IF EXISTS "delete_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "insert_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "select_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "temp_insert_all" ON subscriptions;
DROP POLICY IF EXISTS "temp_select_all" ON subscriptions;
DROP POLICY IF EXISTS "temp_update_all" ON subscriptions;
DROP POLICY IF EXISTS "update_own_business_subscription" ON subscriptions;

-- Verificar que TODAS se eliminaron
SELECT count(*) as policies_remaining FROM pg_policies WHERE tablename = 'subscriptions';

-- Crear políticas RLS SIMPLES y PERMISIVAS (temporal para debugging)
-- Cualquier usuario autenticado puede ver, crear, actualizar suscripciones

CREATE POLICY "allow_authenticated_select" ON subscriptions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert" ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update" ON subscriptions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete" ON subscriptions
FOR DELETE
TO authenticated
USING (true);

-- Verificar que se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- Reemplazar políticas permisivas con políticas restrictivas (T1 - Private User Data)
-- Solo los dueños del negocio pueden ver/editar sus suscripciones

-- Eliminar políticas permisivas temporales
DROP POLICY IF EXISTS "temp_select_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_insert_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_update_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_delete_subscriptions" ON subscriptions;

-- Crear políticas restrictivas (solo dueños del negocio)
CREATE POLICY "owner_select_subscriptions"
ON subscriptions
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_insert_subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_update_subscriptions"
ON subscriptions
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_delete_subscriptions"
ON subscriptions
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN qual
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'UPDATE' THEN qual || ' | ' || with_check
    WHEN cmd = 'DELETE' THEN qual
  END as policy_logic
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- Eliminar las políticas permisivas que quedaron
DROP POLICY IF EXISTS "allow_authenticated_select" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_update" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON subscriptions;

-- Verificar que solo queden las políticas restrictivas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN qual
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'UPDATE' THEN qual || ' | ' || with_check
    WHEN cmd = 'DELETE' THEN qual
  END as policy_logic
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';

-- 1. Crear tabla de permisos para empleados
CREATE TABLE IF NOT EXISTS employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Permisos por módulo (true = tiene acceso)
  can_access_pos boolean DEFAULT false,
  can_manage_products boolean DEFAULT false,
  can_view_products boolean DEFAULT false,
  can_manage_inventory boolean DEFAULT false,
  can_view_inventory boolean DEFAULT false,
  can_manage_customers boolean DEFAULT false,
  can_view_customers boolean DEFAULT false,
  can_manage_cash_register boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_settings boolean DEFAULT false,
  can_manage_employees boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(employee_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);

-- 2. Habilitar RLS
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para employee_permissions (solo dueños pueden gestionar)
CREATE POLICY "owner_manage_permissions" ON employee_permissions
FOR ALL
USING (
  employee_id IN (
    SELECT e.id FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE b.owner_id = auth.uid()
  )
);

-- Política para que empleados vean sus propios permisos
CREATE POLICY "employee_view_own_permissions" ON employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- 4. Crear función helper para verificar permisos de empleado
CREATE OR REPLACE FUNCTION has_permission(
  p_business_id uuid,
  p_permission text
) RETURNS boolean AS $$
DECLARE
  v_employee_id uuid;
  v_role text;
  v_has_permission boolean;
BEGIN
  -- Obtener el employee_id y role del usuario actual
  SELECT e.id, e.role INTO v_employee_id, v_role
  FROM employees e
  WHERE e.business_id = p_business_id 
    AND e.user_id = auth.uid()
    AND e.is_active = true;
  
  -- Si no es empleado del negocio, retornar false
  IF v_employee_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Si es owner o admin, tiene todos los permisos
  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Para cashiers, verificar permisos específicos
  SELECT 
    CASE p_permission
      WHEN 'pos' THEN COALESCE(can_access_pos, false)
      WHEN 'products_manage' THEN COALESCE(can_manage_products, false)
      WHEN 'products_view' THEN COALESCE(can_view_products, false)
      WHEN 'inventory_manage' THEN COALESCE(can_manage_inventory, false)
      WHEN 'inventory_view' THEN COALESCE(can_view_inventory, false)
      WHEN 'customers_manage' THEN COALESCE(can_manage_customers, false)
      WHEN 'customers_view' THEN COALESCE(can_view_customers, false)
      WHEN 'cash_register' THEN COALESCE(can_manage_cash_register, false)
      WHEN 'reports' THEN COALESCE(can_view_reports, false)
      WHEN 'settings' THEN COALESCE(can_manage_settings, false)
      WHEN 'employees' THEN COALESCE(can_manage_employees, false)
      ELSE false
    END INTO v_has_permission
  FROM employee_permissions
  WHERE employee_id = v_employee_id;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para crear permisos por defecto al crear cajero
CREATE OR REPLACE FUNCTION create_default_cashier_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear permisos por defecto si es cashier
  IF NEW.role = 'cashier' THEN
    INSERT INTO employee_permissions (
      employee_id,
      can_access_pos,
      can_view_products,
      can_view_customers,
      can_manage_cash_register
    ) VALUES (
      NEW.id,
      true,  -- POS
      true,  -- Ver productos
      true,  -- Ver clientes
      true   -- Gestionar caja
    )
    ON CONFLICT (employee_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_cashier_permissions ON employees;
CREATE TRIGGER trigger_create_cashier_permissions
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION create_default_cashier_permissions();

-- ============================================================
-- ACTUALIZAR POLÍTICAS RLS PARA PERMITIR ACCESO A EMPLEADOS
-- Ahora con los nombres correctos de las tablas
-- ============================================================

-- ============================================================
-- 1. PRODUCTS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_products" ON products;
DROP POLICY IF EXISTS "owner_insert_products" ON products;
DROP POLICY IF EXISTS "owner_update_products" ON products;
DROP POLICY IF EXISTS "owner_delete_products" ON products;

CREATE POLICY "owner_or_employee_select_products" ON products
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_products" ON products
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_update_products" ON products
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_delete_products" ON products
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

-- ============================================================
-- 2. CATEGORIES - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_categories" ON categories;
DROP POLICY IF EXISTS "owner_insert_categories" ON categories;
DROP POLICY IF EXISTS "owner_update_categories" ON categories;
DROP POLICY IF EXISTS "owner_delete_categories" ON categories;

CREATE POLICY "owner_or_employee_select_categories" ON categories
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_categories" ON categories
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_update_categories" ON categories
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_delete_categories" ON categories
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

-- ============================================================
-- 3. PRODUCT_VARIANTS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_insert_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_update_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_delete_product_variants" ON product_variants;

CREATE POLICY "owner_or_employee_select_product_variants" ON product_variants
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_insert_product_variants" ON product_variants
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_variants" ON product_variants
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_variants" ON product_variants
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 4. PRODUCT_EXTRAS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_insert_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_update_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_delete_product_extras" ON product_extras;

CREATE POLICY "owner_or_employee_select_product_extras" ON product_extras
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_insert_product_extras" ON product_extras
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_extras" ON product_extras
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_extras" ON product_extras
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 5. INVENTORY_ITEMS - Requiere permiso 'inventory'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_insert_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_update_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_delete_inventory_items" ON inventory_items;

CREATE POLICY "owner_or_employee_select_inventory_items" ON inventory_items
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_insert_inventory_items" ON inventory_items
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_update_inventory_items" ON inventory_items
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_delete_inventory_items" ON inventory_items
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

-- ============================================================
-- 6. INVENTORY_MOVEMENTS - Requiere permiso 'inventory'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_insert_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_update_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_delete_inventory_movements" ON inventory_movements;

CREATE POLICY "owner_or_employee_select_inventory_movements" ON inventory_movements
FOR SELECT
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_insert_inventory_movements" ON inventory_movements
FOR INSERT
WITH CHECK (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_update_inventory_movements" ON inventory_movements
FOR UPDATE
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_delete_inventory_movements" ON inventory_movements
FOR DELETE
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

-- ============================================================
-- 7. PRODUCT_INVENTORY_ITEMS - Requiere permiso 'inventory' o 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_insert_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_update_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_delete_product_inventory_items" ON product_inventory_items;

CREATE POLICY "owner_or_employee_select_product_inventory_items" ON product_inventory_items
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_insert_product_inventory_items" ON product_inventory_items
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_inventory_items" ON product_inventory_items
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_inventory_items" ON product_inventory_items
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 8. CUSTOMERS - Requiere permiso 'customers'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_customers" ON customers;
DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
DROP POLICY IF EXISTS "owner_update_customers" ON customers;
DROP POLICY IF EXISTS "owner_delete_customers" ON customers;

CREATE POLICY "owner_or_employee_select_customers" ON customers
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_customers" ON customers
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

CREATE POLICY "owner_or_employee_update_customers" ON customers
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

CREATE POLICY "owner_or_employee_delete_customers" ON customers
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

-- ============================================================
-- 9. SALES - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sales" ON sales;
DROP POLICY IF EXISTS "owner_insert_sales" ON sales;
DROP POLICY IF EXISTS "owner_update_sales" ON sales;
DROP POLICY IF EXISTS "owner_delete_sales" ON sales;

CREATE POLICY "owner_or_employee_select_sales" ON sales
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
  OR
  has_permission(business_id, 'reports')
);

CREATE POLICY "owner_or_employee_insert_sales" ON sales
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_update_sales" ON sales
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_delete_sales" ON sales
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- ============================================================
-- 10. SALE_ITEMS - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_delete_sale_items" ON sale_items;

CREATE POLICY "owner_or_employee_select_sale_items" ON sale_items
FOR SELECT
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'reports')
  )
);

CREATE POLICY "owner_or_employee_insert_sale_items" ON sale_items
FOR INSERT
WITH CHECK (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_update_sale_items" ON sale_items
FOR UPDATE
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_delete_sale_items" ON sale_items
FOR DELETE
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
);

-- ============================================================
-- 11. SALE_ITEM_EXTRAS - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_insert_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_update_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_delete_sale_item_extras" ON sale_item_extras;

CREATE POLICY "owner_or_employee_select_sale_item_extras" ON sale_item_extras
FOR SELECT
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'reports')
  )
);

CREATE POLICY "owner_or_employee_insert_sale_item_extras" ON sale_item_extras
FOR INSERT
WITH CHECK (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_update_sale_item_extras" ON sale_item_extras
FOR UPDATE
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_delete_sale_item_extras" ON sale_item_extras
FOR DELETE
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
);

-- ============================================================
-- 12. CASH_REGISTERS - Requiere permiso 'cash_register'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_insert_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_update_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_delete_cash_registers" ON cash_registers;

CREATE POLICY "owner_or_employee_select_cash_registers" ON cash_registers
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_cash_registers" ON cash_registers
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
);

CREATE POLICY "owner_or_employee_update_cash_registers" ON cash_registers
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
);

CREATE POLICY "owner_or_employee_delete_cash_registers" ON cash_registers
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- ============================================================
-- 13. PAYMENT_METHODS - Requiere permiso 'settings'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_insert_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_update_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_delete_payment_methods" ON payment_methods;

CREATE POLICY "owner_or_employee_select_payment_methods" ON payment_methods
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_payment_methods" ON payment_methods
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

CREATE POLICY "owner_or_employee_update_payment_methods" ON payment_methods
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

CREATE POLICY "owner_or_employee_delete_payment_methods" ON payment_methods
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

-- ============================================================
-- 14. EMPLOYEES - Requiere permiso 'employees'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_employees" ON employees;
DROP POLICY IF EXISTS "owner_insert_employees" ON employees;
DROP POLICY IF EXISTS "owner_update_employees" ON employees;
DROP POLICY IF EXISTS "owner_delete_employees" ON employees;

CREATE POLICY "owner_or_employee_select_employees" ON employees
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
  OR
  user_id = auth.uid()  -- Empleados pueden ver su propio registro
);

CREATE POLICY "owner_or_employee_insert_employees" ON employees
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

CREATE POLICY "owner_or_employee_update_employees" ON employees
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

CREATE POLICY "owner_or_employee_delete_employees" ON employees
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

-- ============================================================
-- 15. EMPLOYEE_PERMISSIONS - Solo owners o empleados con permiso 'employees'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_insert_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_update_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_delete_employee_permissions" ON employee_permissions;

CREATE POLICY "owner_or_manager_select_permissions" ON employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
  OR
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()  -- Ver tus propios permisos
  )
);

CREATE POLICY "owner_or_manager_insert_permissions" ON employee_permissions
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

CREATE POLICY "owner_or_manager_update_permissions" ON employee_permissions
FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

CREATE POLICY "owner_or_manager_delete_permissions" ON employee_permissions
FOR DELETE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

-- ============================================================
-- Verificar políticas creadas
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'categories', 'product_variants', 'product_extras',
    'inventory_items', 'inventory_movements', 'product_inventory_items',
    'customers', 'sales', 'sale_items', 'sale_item_extras',
    'cash_registers', 'payment_methods', 'employees', 'employee_permissions'
  )
ORDER BY tablename, cmd, policyname;

DROP TABLE IF EXISTS employee_permissions CASCADE;

CREATE TABLE employee_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, module)
);

ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_or_manager_select_permissions" ON employee_permissions
FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "owner_or_manager_insert_permissions" ON employee_permissions
FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

CREATE POLICY "owner_or_manager_update_permissions" ON employee_permissions
FOR UPDATE USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

CREATE POLICY "owner_or_manager_delete_permissions" ON employee_permissions
FOR DELETE USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

-- Drop the policy if it exists first, then create it
DROP POLICY IF EXISTS "service_role_can_insert_employees" ON employees;

CREATE POLICY "service_role_can_insert_employees"
ON employees
FOR INSERT
TO service_role
WITH CHECK (true);

-- Eliminar el trigger viejo
DROP TRIGGER IF EXISTS create_cashier_permissions_trigger ON employees;
DROP TRIGGER IF EXISTS on_employee_created ON employees;
DROP TRIGGER IF EXISTS create_default_permissions ON employees;

-- Recrear el trigger con el nuevo código
CREATE TRIGGER create_cashier_permissions_trigger
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION create_default_cashier_permissions();

-- Eliminar el trigger duplicado (solo necesitamos uno)
DROP TRIGGER IF EXISTS trigger_create_cashier_permissions ON employees;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

ALTER TABLE product_inventory_items ADD COLUMN IF NOT EXISTS extra_id UUID REFERENCES product_extras(id) ON DELETE CASCADE;

-- Drop the restrictive unique constraint so we can have the same inventory item in different variants/extras
ALTER TABLE product_inventory_items DROP CONSTRAINT IF EXISTS product_inventory_items_product_id_inventory_item_id_key;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_inventory_items_extra_id ON product_inventory_items(extra_id);

-- Crear política que permita al super admin ver TODOS los negocios
CREATE POLICY "super_admin_read_all_businesses" ON businesses
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'mxrioxw@gmail.com'
  )
  OR auth.uid() = owner_id
);

-- Crear política que permita al super admin ver TODAS las suscripciones
CREATE POLICY "super_admin_read_all_subscriptions" ON subscriptions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'mxrioxw@gmail.com'
  )
  OR EXISTS (
    SELECT 1 FROM businesses WHERE id = subscriptions.business_id AND owner_id = auth.uid()
  )
);

-- Crear función que se ejecuta automáticamente cuando se confirma un email
CREATE OR REPLACE FUNCTION handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Solo ejecutar si el email acaba de ser confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Verificar que el usuario no sea super admin
    IF NEW.email != 'mxrioxw@gmail.com' THEN
      
      -- Verificar que no tenga negocio ya
      IF NOT EXISTS (SELECT 1 FROM businesses WHERE owner_id = NEW.id) THEN
        
        -- Crear negocio
        INSERT INTO businesses (
          owner_id,
          name,
          slug
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'),
          'negocio-' || EXTRACT(EPOCH FROM NOW())::TEXT
        ) RETURNING id INTO v_business_id;
        
        -- Crear suscripción trial
        v_trial_end := NOW() + INTERVAL '7 days';
        INSERT INTO subscriptions (
          business_id,
          plan,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end
        ) VALUES (
          v_business_id,
          'premium',
          'trialing',
          'monthly',
          NOW(),
          v_trial_end,
          NOW(),
          v_trial_end
        );
        
        -- Crear empleado owner
        INSERT INTO employees (
          business_id,
          user_id,
          role,
          is_active
        ) VALUES (
          v_business_id,
          NEW.id,
          'owner',
          true
        );
        
        RAISE NOTICE 'Negocio creado automáticamente para user %', NEW.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;

-- Crear trigger que se ejecuta cuando se actualiza auth.users
CREATE TRIGGER on_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verified();

-- Crear función que se ejecuta cuando un usuario confirma su email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_business_name TEXT;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Solo proceder si el email acaba de ser confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Obtener el nombre del negocio de los metadatos
    v_business_name := COALESCE(
      NEW.raw_user_meta_data->>'businessName',
      'Mi Negocio'
    );
    
    -- Crear el negocio
    INSERT INTO public.businesses (owner_id, name)
    VALUES (NEW.id, v_business_name)
    RETURNING id INTO v_business_id;
    
    -- Crear suscripción trial (7 días)
    v_trial_end := NOW() + INTERVAL '7 days';
    
    INSERT INTO public.subscriptions (
      business_id,
      plan,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      v_business_id,
      'basic',
      'trialing',
      v_trial_end,
      NOW(),
      v_trial_end
    );
    
    -- Crear registro de empleado owner
    INSERT INTO public.employees (
      business_id,
      user_id,
      role,
      is_active
    ) VALUES (
      v_business_id,
      NEW.id,
      'owner',
      true
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmation();

-- 1. Agregar columna is_super_admin a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Marcar mxrioxw@gmail.com como super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'mxrioxw@gmail.com';

-- Crear y eliminar una tabla dummy para forzar schema refresh
CREATE TABLE IF NOT EXISTS _schema_refresh_trigger (id INT);
DROP TABLE IF EXISTS _schema_refresh_trigger;

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 1. DROP las tablas problemáticas (en orden correcto por dependencias)
DROP TABLE IF EXISTS sale_item_extras CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS product_extras CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- 2. RE-CREAR businesses
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

-- 3. RE-CREAR subscriptions
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

-- 4. RE-CREAR employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role employee_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- 5. RE-CREAR categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RE-CREAR products
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

-- 7. RE-CREAR product_variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RE-CREAR product_extras
CREATE TABLE product_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RE-CREAR inventory_items
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

-- 10. RE-CREAR customers
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

-- 11. RE-CREAR payment_methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. RE-CREAR cash_registers
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

-- 13. RE-CREAR sales
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

-- 14. RE-CREAR sale_items
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

-- 15. RE-CREAR sale_item_extras
CREATE TABLE sale_item_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICAR A POSTGREST
NOTIFY pgrst, 'reload schema';

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

-- Restaurar columnas añadidas en migraciones posteriores
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pos_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS printer_width TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS generates_points BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS points_value INTEGER DEFAULT 0;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT;

-- Forzar refresh
NOTIFY pgrst, 'reload schema';

-- PASO 1: Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PASO 2: Crear tablas principales
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  tax_id TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  primary_color TEXT DEFAULT '#2D1810',
  secondary_color TEXT DEFAULT '#4A362A',
  accent_color TEXT DEFAULT '#4CAF50',
  background_color TEXT DEFAULT '#F8F5F0',
  printer_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier', 'waiter')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'professional', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trial')),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_cycle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

-- PASO 4: Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- PASO 5: Políticas RLS para profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PASO 6: Políticas RLS para businesses
DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
CREATE POLICY "businesses_select_own" ON businesses FOR SELECT USING (
  owner_id = auth.uid() OR 
  id IN (SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true)
);

DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
CREATE POLICY "businesses_insert_own" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE USING (
  owner_id = auth.uid() OR 
  id IN (SELECT business_id FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true)
);

-- PASO 7: Políticas RLS para employees
DROP POLICY IF EXISTS "employees_select_business" ON employees;
CREATE POLICY "employees_select_business" ON employees FOR SELECT USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "employees_insert_business" ON employees;
CREATE POLICY "employees_insert_business" ON employees FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "employees_update_business" ON employees;
CREATE POLICY "employees_update_business" ON employees FOR UPDATE USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- PASO 8: Políticas RLS para subscriptions
DROP POLICY IF EXISTS "subscriptions_select_business" ON subscriptions;
CREATE POLICY "subscriptions_select_business" ON subscriptions FOR SELECT USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "subscriptions_update_business" ON subscriptions;
CREATE POLICY "subscriptions_update_business" ON subscriptions FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- PASO 9: Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 10: Backfill perfiles existentes
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- TABLAS DE OPERACIÓN DEL POS

-- Función helper para obtener business_ids del usuario
CREATE OR REPLACE FUNCTION get_user_business_ids(user_id UUID)
RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id FROM businesses b WHERE b.owner_id = user_id
  UNION
  SELECT e.business_id FROM employees e WHERE e.user_id = user_id AND e.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CATEGORÍAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4CAF50',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT false,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  variants JSONB DEFAULT '[]',
  extras JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSUMOS (materias primas)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AJUSTES DE INVENTARIO
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'subtract', 'set')),
  quantity DECIMAL(10,2) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTES
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MÉTODOS DE PAGO
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'card', 'transfer', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CORTES DE CAJA
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES profiles(id),
  closed_by UUID REFERENCES profiles(id),
  opening_amount DECIMAL(10,2) NOT NULL,
  closing_amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  difference DECIMAL(10,2),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VENTAS
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sale_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL REFERENCES profiles(id),
  cash_register_id UUID REFERENCES cash_registers(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'canceled', 'refunded')) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITEMS DE VENTA
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  variant_name TEXT,
  extras JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAGOS DE VENTA
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON inventory_items(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_business ON inventory_adjustments(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_business ON payment_methods(business_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_business ON cash_registers(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

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

-- Limpiar las tablas creadas manualmente para evitar conflictos con las migraciones
DROP TABLE IF EXISTS
  sale_payments, sale_items, sales, cash_registers, payment_methods, customers,
  inventory_adjustments, inventory_items, products, categories,
  employees, subscriptions, businesses, profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_business_ids(UUID) CASCADE;

