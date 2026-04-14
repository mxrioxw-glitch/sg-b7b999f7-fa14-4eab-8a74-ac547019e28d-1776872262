-- Agregar columna variant_id a product_inventory_items para asociar insumos a variantes específicas
ALTER TABLE product_inventory_items 
ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento en búsquedas por variante
CREATE INDEX idx_product_inventory_items_variant_id 
ON product_inventory_items(variant_id);

COMMENT ON COLUMN product_inventory_items.variant_id IS 
'Si es NULL, el insumo aplica al producto base. Si tiene valor, el insumo solo aplica a esa variante específica (ej: vaso chico solo para café chico)';