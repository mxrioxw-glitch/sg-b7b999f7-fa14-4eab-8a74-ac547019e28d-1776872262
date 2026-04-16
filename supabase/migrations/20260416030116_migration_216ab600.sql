-- TEMPORAL: Crear políticas RLS MUY PERMISIVAS para diagnosticar el problema
-- Una vez que funcione, las haremos más restrictivas

-- Eliminar todas las políticas actuales
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Crear política TEMPORAL muy permisiva para SELECT (leer)
-- Permitir a cualquier usuario autenticado ver las suscripciones
CREATE POLICY "temp_select_all" ON subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Política TEMPORAL para INSERT (crear)
CREATE POLICY "temp_insert_all" ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política TEMPORAL para UPDATE (actualizar)
CREATE POLICY "temp_update_all" ON subscriptions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar que las políticas se crearon
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;