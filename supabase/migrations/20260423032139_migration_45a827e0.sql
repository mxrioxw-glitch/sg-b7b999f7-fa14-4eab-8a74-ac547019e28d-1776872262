-- Limpiar las tablas creadas manualmente para evitar conflictos con las migraciones
DROP TABLE IF EXISTS
  sale_payments, sale_items, sales, cash_registers, payment_methods, customers,
  inventory_adjustments, inventory_items, products, categories,
  employees, subscriptions, businesses, profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_business_ids(UUID) CASCADE;