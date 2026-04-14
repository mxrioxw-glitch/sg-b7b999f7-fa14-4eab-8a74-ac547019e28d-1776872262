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