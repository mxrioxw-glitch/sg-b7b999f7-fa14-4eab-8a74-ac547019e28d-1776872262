-- 1. Agregar columna is_super_admin a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Marcar mxrioxw@gmail.com como super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'mxrioxw@gmail.com';