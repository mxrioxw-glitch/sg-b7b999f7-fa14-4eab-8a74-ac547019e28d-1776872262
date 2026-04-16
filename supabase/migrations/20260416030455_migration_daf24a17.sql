-- Reemplazar políticas permisivas con políticas restrictivas (T1 - Private User Data)
-- Solo los dueños del negocio pueden ver/editar sus suscripciones

-- Eliminar políticas permisivas temporales
DROP POLICY IF EXISTS "temp_select_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_insert_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_update_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "temp_delete_subscriptions" ON subscriptions;

-- Crear políticas restrictivas (solo dueños del negocio)
CREATE POLICY "owner_select_subscriptions"
ON subscriptions
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_insert_subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_update_subscriptions"
ON subscriptions
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "owner_delete_subscriptions"
ON subscriptions
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN qual
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'UPDATE' THEN qual || ' | ' || with_check
    WHEN cmd = 'DELETE' THEN qual
  END as policy_logic
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;