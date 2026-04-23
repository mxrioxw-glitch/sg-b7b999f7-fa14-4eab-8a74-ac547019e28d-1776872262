-- Paso 1: Crear la función trigger para auto-crear perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_super_admin)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Paso 2: Crear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 3: Backfill - Crear perfiles para usuarios existentes que no tengan perfil
INSERT INTO public.profiles (id, email, full_name, is_super_admin)
SELECT 
  u.id, 
  u.email, 
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Paso 4: Convertir a mxrioxw@gmail.com en Super Admin
UPDATE public.profiles
SET is_super_admin = true
WHERE email = 'mxrioxw@gmail.com';

-- Verificar resultado
SELECT id, email, full_name, is_super_admin, created_at
FROM public.profiles
WHERE email = 'mxrioxw@gmail.com';