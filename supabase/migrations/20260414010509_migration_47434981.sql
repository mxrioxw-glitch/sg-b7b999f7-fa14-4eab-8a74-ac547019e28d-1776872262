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