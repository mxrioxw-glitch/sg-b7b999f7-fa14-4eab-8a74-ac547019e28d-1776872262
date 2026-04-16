-- Eliminar el trigger viejo
DROP TRIGGER IF EXISTS create_cashier_permissions_trigger ON employees;
DROP TRIGGER IF EXISTS on_employee_created ON employees;
DROP TRIGGER IF EXISTS create_default_permissions ON employees;