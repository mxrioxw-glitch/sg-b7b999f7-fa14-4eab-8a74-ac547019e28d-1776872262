-- Crear políticas RLS SIMPLES y PERMISIVAS (temporal para debugging)
-- Cualquier usuario autenticado puede ver, crear, actualizar suscripciones

CREATE POLICY "allow_authenticated_select" ON subscriptions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert" ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update" ON subscriptions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete" ON subscriptions
FOR DELETE
TO authenticated
USING (true);

-- Verificar que se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;