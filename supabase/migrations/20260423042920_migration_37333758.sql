-- Paso 1: Agregar columna is_super_admin a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Paso 2: Crear el usuario Super Admin (si no existe)
-- Nota: Esto se hace a través de la autenticación de Supabase
-- Por ahora, vamos a preparar la estructura para cuando el usuario se registre

-- Paso 3: Crear una función para promover a Super Admin
CREATE OR REPLACE FUNCTION promote_to_super_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET is_super_admin = true
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'is_super_admin';