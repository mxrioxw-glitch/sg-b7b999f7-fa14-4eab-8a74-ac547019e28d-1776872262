-- Agregar foreign key constraint faltante
ALTER TABLE tables
ADD CONSTRAINT tables_current_order_id_fkey
FOREIGN KEY (current_order_id)
REFERENCES table_orders(id)
ON DELETE SET NULL;