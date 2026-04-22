ALTER TABLE product_inventory_items ADD COLUMN IF NOT EXISTS extra_id UUID REFERENCES product_extras(id) ON DELETE CASCADE;

-- Drop the restrictive unique constraint so we can have the same inventory item in different variants/extras
ALTER TABLE product_inventory_items DROP CONSTRAINT IF EXISTS product_inventory_items_product_id_inventory_item_id_key;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_inventory_items_extra_id ON product_inventory_items(extra_id);