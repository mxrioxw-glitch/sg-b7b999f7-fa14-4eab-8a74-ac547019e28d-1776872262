-- Agregar customer_id a table_orders si no existe
ALTER TABLE table_orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;