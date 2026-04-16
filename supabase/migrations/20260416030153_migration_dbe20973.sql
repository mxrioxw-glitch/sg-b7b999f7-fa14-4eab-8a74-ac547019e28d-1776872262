-- LIMPIAR TODAS LAS POLÍTICAS DUPLICADAS
DROP POLICY IF EXISTS "Users can create subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions for their businesses" ON subscriptions;
DROP POLICY IF EXISTS "View subscriptions for user's businesses" ON subscriptions;
DROP POLICY IF EXISTS "delete_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "insert_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "select_own_business_subscription" ON subscriptions;
DROP POLICY IF EXISTS "temp_insert_all" ON subscriptions;
DROP POLICY IF EXISTS "temp_select_all" ON subscriptions;
DROP POLICY IF EXISTS "temp_update_all" ON subscriptions;
DROP POLICY IF EXISTS "update_own_business_subscription" ON subscriptions;

-- Verificar que TODAS se eliminaron
SELECT count(*) as policies_remaining FROM pg_policies WHERE tablename = 'subscriptions';