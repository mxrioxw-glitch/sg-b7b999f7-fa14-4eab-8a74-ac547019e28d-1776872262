-- Tabla de Mesas Físicas
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  area TEXT NULL, -- Zona/área del restaurante (terraza, interior, etc.)
  status TEXT NOT NULL DEFAULT 'available', -- available, occupied, dirty, reserved
  current_order_id UUID NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_id, table_number)
);

-- Tabla de Órdenes de Mesa (Comandas en Curso)
CREATE TABLE table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  assigned_waiter_id UUID NULL REFERENCES employees(id) ON DELETE SET NULL,
  customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, sent_to_kitchen, ready, billing, closed
  subtotal NUMERIC DEFAULT 0 NOT NULL,
  tax_amount NUMERIC DEFAULT 0 NOT NULL,
  total NUMERIC DEFAULT 0 NOT NULL,
  tip_amount NUMERIC DEFAULT 0,
  guests_count INTEGER DEFAULT 1,
  notes TEXT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Items de Orden de Mesa
CREATE TABLE table_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_order_id UUID NOT NULL REFERENCES table_orders(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NULL,
  quantity NUMERIC DEFAULT 1 NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0 NOT NULL,
  total NUMERIC NOT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent_to_kitchen, preparing, ready, served
  sent_to_kitchen_at TIMESTAMP WITH TIME ZONE NULL,
  served_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Extras de Items de Orden de Mesa
CREATE TABLE table_order_item_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_order_item_id UUID NOT NULL REFERENCES table_order_items(id) ON DELETE CASCADE,
  extra_id UUID NULL REFERENCES product_extras(id) ON DELETE SET NULL,
  extra_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies para tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_tables_of_own_business"
ON tables FOR SELECT
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_insert_tables_of_own_business"
ON tables FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_tables_of_own_business"
ON tables FOR UPDATE
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_delete_tables_of_own_business"
ON tables FOR DELETE
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

-- RLS Policies para table_orders
ALTER TABLE table_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_table_orders_of_own_business"
ON table_orders FOR SELECT
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_insert_table_orders_of_own_business"
ON table_orders FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_table_orders_of_own_business"
ON table_orders FOR UPDATE
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_delete_table_orders_of_own_business"
ON table_orders FOR DELETE
USING (
  business_id IN (
    SELECT e.business_id FROM employees e WHERE e.user_id = auth.uid()
  )
);

-- RLS Policies para table_order_items
ALTER TABLE table_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_table_order_items_of_own_business"
ON table_order_items FOR SELECT
USING (
  table_order_id IN (
    SELECT to_tbl.id FROM table_orders to_tbl
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_insert_table_order_items_of_own_business"
ON table_order_items FOR INSERT
WITH CHECK (
  table_order_id IN (
    SELECT to_tbl.id FROM table_orders to_tbl
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_table_order_items_of_own_business"
ON table_order_items FOR UPDATE
USING (
  table_order_id IN (
    SELECT to_tbl.id FROM table_orders to_tbl
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_delete_table_order_items_of_own_business"
ON table_order_items FOR DELETE
USING (
  table_order_id IN (
    SELECT to_tbl.id FROM table_orders to_tbl
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

-- RLS Policies para table_order_item_extras
ALTER TABLE table_order_item_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_table_order_item_extras_of_own_business"
ON table_order_item_extras FOR SELECT
USING (
  table_order_item_id IN (
    SELECT toi.id FROM table_order_items toi
    JOIN table_orders to_tbl ON to_tbl.id = toi.table_order_id
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_insert_table_order_item_extras_of_own_business"
ON table_order_item_extras FOR INSERT
WITH CHECK (
  table_order_item_id IN (
    SELECT toi.id FROM table_order_items toi
    JOIN table_orders to_tbl ON to_tbl.id = toi.table_order_id
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_table_order_item_extras_of_own_business"
ON table_order_item_extras FOR UPDATE
USING (
  table_order_item_id IN (
    SELECT toi.id FROM table_order_items toi
    JOIN table_orders to_tbl ON to_tbl.id = toi.table_order_id
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_delete_table_order_item_extras_of_own_business"
ON table_order_item_extras FOR DELETE
USING (
  table_order_item_id IN (
    SELECT toi.id FROM table_order_items toi
    JOIN table_orders to_tbl ON to_tbl.id = toi.table_order_id
    JOIN employees e ON e.business_id = to_tbl.business_id
    WHERE e.user_id = auth.uid()
  )
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_tables_business_id ON tables(business_id);
CREATE INDEX idx_table_orders_business_id ON table_orders(business_id);
CREATE INDEX idx_table_orders_table_id ON table_orders(table_id);
CREATE INDEX idx_table_orders_status ON table_orders(status);
CREATE INDEX idx_table_order_items_order_id ON table_order_items(table_order_id);
CREATE INDEX idx_table_order_items_status ON table_order_items(status);