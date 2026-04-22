-- Crear política que permita al super admin ver TODAS las suscripciones
CREATE POLICY "super_admin_read_all_subscriptions" ON subscriptions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'mxrioxw@gmail.com'
  )
  OR EXISTS (
    SELECT 1 FROM businesses WHERE id = subscriptions.business_id AND owner_id = auth.uid()
  )
);