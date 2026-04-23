-- Crear políticas RLS SIMPLES sin recursión

-- 1. Permitir INSERT desde el trigger (sin restricciones)
CREATE POLICY "enable_insert_for_authenticated_users_only"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Permitir que usuarios vean su propio perfil
CREATE POLICY "enable_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Permitir que usuarios actualicen su propio perfil
CREATE POLICY "enable_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Permitir que service_role vea todo (para queries del backend)
-- No agregar política para super_admins aquí - causaría recursión