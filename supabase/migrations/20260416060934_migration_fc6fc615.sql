-- Recrear el trigger con el nuevo código
CREATE TRIGGER create_cashier_permissions_trigger
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION create_default_cashier_permissions();