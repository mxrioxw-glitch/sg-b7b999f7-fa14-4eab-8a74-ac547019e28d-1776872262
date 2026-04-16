-- Eliminar TODAS las políticas actuales de subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "users_insert_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "users_update_own_subscription" ON subscriptions;

-- Crear políticas RLS simples y directas (patrón T1 - datos privados)
CREATE POLICY "select_own_business_subscription" ON subscriptions
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "insert_own_business_subscription" ON subscriptions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "update_own_business_subscription" ON subscriptions
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "delete_own_business_subscription" ON subscriptions
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);