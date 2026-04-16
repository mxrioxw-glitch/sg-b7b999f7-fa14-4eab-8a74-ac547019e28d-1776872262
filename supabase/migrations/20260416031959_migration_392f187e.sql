-- 1. Crear tabla de permisos para empleados
CREATE TABLE IF NOT EXISTS employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Permisos por módulo (true = tiene acceso)
  can_access_pos boolean DEFAULT false,
  can_manage_products boolean DEFAULT false,
  can_view_products boolean DEFAULT false,
  can_manage_inventory boolean DEFAULT false,
  can_view_inventory boolean DEFAULT false,
  can_manage_customers boolean DEFAULT false,
  can_view_customers boolean DEFAULT false,
  can_manage_cash_register boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_settings boolean DEFAULT false,
  can_manage_employees boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(employee_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);

-- 2. Habilitar RLS
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para employee_permissions (solo dueños pueden gestionar)
CREATE POLICY "owner_manage_permissions" ON employee_permissions
FOR ALL
USING (
  employee_id IN (
    SELECT e.id FROM employees e
    JOIN businesses b ON b.id = e.business_id
    WHERE b.owner_id = auth.uid()
  )
);

-- Política para que empleados vean sus propios permisos
CREATE POLICY "employee_view_own_permissions" ON employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- 4. Crear función helper para verificar permisos de empleado
CREATE OR REPLACE FUNCTION has_permission(
  p_business_id uuid,
  p_permission text
) RETURNS boolean AS $$
DECLARE
  v_employee_id uuid;
  v_role text;
  v_has_permission boolean;
BEGIN
  -- Obtener el employee_id y role del usuario actual
  SELECT e.id, e.role INTO v_employee_id, v_role
  FROM employees e
  WHERE e.business_id = p_business_id 
    AND e.user_id = auth.uid()
    AND e.is_active = true;
  
  -- Si no es empleado del negocio, retornar false
  IF v_employee_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Si es owner o admin, tiene todos los permisos
  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Para cashiers, verificar permisos específicos
  SELECT 
    CASE p_permission
      WHEN 'pos' THEN COALESCE(can_access_pos, false)
      WHEN 'products_manage' THEN COALESCE(can_manage_products, false)
      WHEN 'products_view' THEN COALESCE(can_view_products, false)
      WHEN 'inventory_manage' THEN COALESCE(can_manage_inventory, false)
      WHEN 'inventory_view' THEN COALESCE(can_view_inventory, false)
      WHEN 'customers_manage' THEN COALESCE(can_manage_customers, false)
      WHEN 'customers_view' THEN COALESCE(can_view_customers, false)
      WHEN 'cash_register' THEN COALESCE(can_manage_cash_register, false)
      WHEN 'reports' THEN COALESCE(can_view_reports, false)
      WHEN 'settings' THEN COALESCE(can_manage_settings, false)
      WHEN 'employees' THEN COALESCE(can_manage_employees, false)
      ELSE false
    END INTO v_has_permission
  FROM employee_permissions
  WHERE employee_id = v_employee_id;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para crear permisos por defecto al crear cajero
CREATE OR REPLACE FUNCTION create_default_cashier_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear permisos por defecto si es cashier
  IF NEW.role = 'cashier' THEN
    INSERT INTO employee_permissions (
      employee_id,
      can_access_pos,
      can_view_products,
      can_view_customers,
      can_manage_cash_register
    ) VALUES (
      NEW.id,
      true,  -- POS
      true,  -- Ver productos
      true,  -- Ver clientes
      true   -- Gestionar caja
    )
    ON CONFLICT (employee_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_cashier_permissions ON employees;
CREATE TRIGGER trigger_create_cashier_permissions
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION create_default_cashier_permissions();