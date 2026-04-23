-- Crear políticas RLS para la tabla employees

-- 1. Permitir crear empleados para negocios propios
CREATE POLICY "users_can_create_employees_for_own_business"
ON public.employees
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- 2. Permitir ver empleados de negocios propios
CREATE POLICY "users_can_view_employees_of_own_business"
ON public.employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- 3. Super admins pueden ver todos los empleados
CREATE POLICY "super_admins_can_view_all_employees"
ON public.employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

-- 4. Permitir actualizar empleados de negocios propios
CREATE POLICY "users_can_update_employees_of_own_business"
ON public.employees
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- 5. Super admins pueden actualizar todos los empleados
CREATE POLICY "super_admins_can_update_all_employees"
ON public.employees
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

-- 6. Permitir eliminar empleados de negocios propios
CREATE POLICY "users_can_delete_employees_of_own_business"
ON public.employees
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;