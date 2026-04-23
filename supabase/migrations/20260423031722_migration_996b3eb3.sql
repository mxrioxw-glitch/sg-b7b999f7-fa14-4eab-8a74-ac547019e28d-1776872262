-- PASO 1: Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PASO 2: Crear tablas principales
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  tax_id TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  primary_color TEXT DEFAULT '#2D1810',
  secondary_color TEXT DEFAULT '#4A362A',
  accent_color TEXT DEFAULT '#4CAF50',
  background_color TEXT DEFAULT '#F8F5F0',
  printer_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier', 'waiter')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'professional', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trial')),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_cycle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

-- PASO 4: Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- PASO 5: Políticas RLS para profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PASO 6: Políticas RLS para businesses
DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
CREATE POLICY "businesses_select_own" ON businesses FOR SELECT USING (
  owner_id = auth.uid() OR 
  id IN (SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true)
);

DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
CREATE POLICY "businesses_insert_own" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE USING (
  owner_id = auth.uid() OR 
  id IN (SELECT business_id FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true)
);

-- PASO 7: Políticas RLS para employees
DROP POLICY IF EXISTS "employees_select_business" ON employees;
CREATE POLICY "employees_select_business" ON employees FOR SELECT USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "employees_insert_business" ON employees;
CREATE POLICY "employees_insert_business" ON employees FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "employees_update_business" ON employees;
CREATE POLICY "employees_update_business" ON employees FOR UPDATE USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- PASO 8: Políticas RLS para subscriptions
DROP POLICY IF EXISTS "subscriptions_select_business" ON subscriptions;
CREATE POLICY "subscriptions_select_business" ON subscriptions FOR SELECT USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM employees WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "subscriptions_update_business" ON subscriptions;
CREATE POLICY "subscriptions_update_business" ON subscriptions FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- PASO 9: Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 10: Backfill perfiles existentes
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;