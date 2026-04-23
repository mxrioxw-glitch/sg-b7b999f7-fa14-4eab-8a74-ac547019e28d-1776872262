-- Eliminar TODAS las políticas de profiles para empezar de cero
DROP POLICY IF EXISTS "allow_insert_via_trigger" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "super_admins_can_view_all_profiles" ON profiles;