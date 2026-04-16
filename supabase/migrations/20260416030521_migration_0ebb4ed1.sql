-- Eliminar las políticas permisivas que quedaron
DROP POLICY IF EXISTS "allow_authenticated_select" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_update" ON subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON subscriptions;

-- Verificar que solo queden las políticas restrictivas
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