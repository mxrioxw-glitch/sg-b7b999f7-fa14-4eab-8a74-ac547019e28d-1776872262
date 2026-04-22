-- Crear política que permita al super admin ver TODOS los negocios
CREATE POLICY "super_admin_read_all_businesses" ON businesses
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'mxrioxw@gmail.com'
  )
  OR auth.uid() = owner_id
);