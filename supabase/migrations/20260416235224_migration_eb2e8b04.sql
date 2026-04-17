-- Eliminar el trigger duplicado (solo necesitamos uno)
DROP TRIGGER IF EXISTS trigger_create_cashier_permissions ON employees;