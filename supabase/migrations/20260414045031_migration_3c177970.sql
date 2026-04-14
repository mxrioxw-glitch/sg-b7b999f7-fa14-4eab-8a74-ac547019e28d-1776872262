-- Create subscription_plans table to store configurable plan pricing
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY, -- 'basic', 'professional', 'premium'
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2) NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_branches integer NOT NULL DEFAULT 1,
  max_products integer NOT NULL DEFAULT 100,
  max_employees integer NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read plans (public data)
CREATE POLICY "public_read_plans" ON subscription_plans
  FOR SELECT USING (true);

-- Policy: Only super admin can update plans (we'll check this in the app)
CREATE POLICY "admin_update_plans" ON subscription_plans
  FOR UPDATE USING (true);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, features, max_branches, max_products, max_employees, sort_order)
VALUES 
  ('basic', 'Básico', 299, 2990, 
   '["1 sucursal", "100 productos", "2 empleados", "Reportes básicos", "Soporte por email"]'::jsonb, 
   1, 100, 2, 1),
  ('professional', 'Profesional', 599, 5990,
   '["3 sucursales", "Productos ilimitados", "5 empleados", "Reportes avanzados", "Multi-caja", "Soporte prioritario"]'::jsonb,
   3, 999999, 5, 2),
  ('premium', 'Premium', 999, 9990,
   '["Sucursales ilimitadas", "Productos ilimitados", "Empleados ilimitados", "Dashboard en tiempo real", "API acceso", "Soporte 24/7"]'::jsonb,
   999999, 999999, 999999, 3)
ON CONFLICT (id) DO NOTHING;