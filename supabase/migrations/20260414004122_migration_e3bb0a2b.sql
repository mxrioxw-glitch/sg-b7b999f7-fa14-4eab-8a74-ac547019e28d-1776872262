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