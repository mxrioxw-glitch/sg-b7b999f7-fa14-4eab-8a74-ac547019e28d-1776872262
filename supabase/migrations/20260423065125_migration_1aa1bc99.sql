-- Crear políticas RLS para la tabla businesses

-- 1. Permitir a los usuarios crear sus propios negocios
CREATE POLICY "users_can_create_own_business" ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 2. Permitir a los usuarios ver sus propios negocios
CREATE POLICY "users_can_view_own_business" ON public.businesses
  FOR SELECT
  USING (auth.uid() = owner_id);

-- 3. Permitir a los super admins ver TODOS los negocios
CREATE POLICY "super_admins_can_view_all_businesses" ON public.businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- 4. Permitir a los usuarios actualizar sus propios negocios
CREATE POLICY "users_can_update_own_business" ON public.businesses
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 5. Permitir a los super admins actualizar CUALQUIER negocio (activar/desactivar)
CREATE POLICY "super_admins_can_update_any_business" ON public.businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;