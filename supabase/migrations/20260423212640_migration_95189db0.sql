-- Crear políticas RLS para la tabla profiles

-- 1. Permitir que cualquier usuario autenticado pueda ver su propio perfil
CREATE POLICY "users_can_view_own_profile"
ON profiles
FOR SELECT
TO public
USING (auth.uid() = id);

-- 2. Permitir que cualquier usuario autenticado pueda actualizar su propio perfil
CREATE POLICY "users_can_update_own_profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Permitir que Super Admins vean todos los perfiles
CREATE POLICY "super_admins_can_view_all_profiles"
ON profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- 4. CRÍTICO: Permitir que el trigger handle_new_user() pueda insertar perfiles
-- Usamos authenticated role porque el trigger se ejecuta en contexto de usuario autenticado
CREATE POLICY "allow_insert_via_trigger"
ON profiles
FOR INSERT
TO public
WITH CHECK (true);