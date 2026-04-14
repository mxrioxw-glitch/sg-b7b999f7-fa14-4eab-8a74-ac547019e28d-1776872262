-- Add points configuration to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS generates_points BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS points_value INTEGER DEFAULT 0;

-- Update existing products to have default values
UPDATE products 
SET generates_points = false, points_value = 0 
WHERE generates_points IS NULL;