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