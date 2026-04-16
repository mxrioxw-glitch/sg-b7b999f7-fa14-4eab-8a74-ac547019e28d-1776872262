-- ============================================================
-- ACTUALIZAR POLÍTICAS RLS PARA PERMITIR ACCESO A EMPLEADOS
-- Ahora con los nombres correctos de las tablas
-- ============================================================

-- ============================================================
-- 1. PRODUCTS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_products" ON products;
DROP POLICY IF EXISTS "owner_insert_products" ON products;
DROP POLICY IF EXISTS "owner_update_products" ON products;
DROP POLICY IF EXISTS "owner_delete_products" ON products;

CREATE POLICY "owner_or_employee_select_products" ON products
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_products" ON products
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_update_products" ON products
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_delete_products" ON products
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

-- ============================================================
-- 2. CATEGORIES - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_categories" ON categories;
DROP POLICY IF EXISTS "owner_insert_categories" ON categories;
DROP POLICY IF EXISTS "owner_update_categories" ON categories;
DROP POLICY IF EXISTS "owner_delete_categories" ON categories;

CREATE POLICY "owner_or_employee_select_categories" ON categories
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_categories" ON categories
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_update_categories" ON categories
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

CREATE POLICY "owner_or_employee_delete_categories" ON categories
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'products')
);

-- ============================================================
-- 3. PRODUCT_VARIANTS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_insert_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_update_product_variants" ON product_variants;
DROP POLICY IF EXISTS "owner_delete_product_variants" ON product_variants;

CREATE POLICY "owner_or_employee_select_product_variants" ON product_variants
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_insert_product_variants" ON product_variants
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_variants" ON product_variants
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_variants" ON product_variants
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 4. PRODUCT_EXTRAS - Requiere permiso 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_insert_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_update_product_extras" ON product_extras;
DROP POLICY IF EXISTS "owner_delete_product_extras" ON product_extras;

CREATE POLICY "owner_or_employee_select_product_extras" ON product_extras
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_insert_product_extras" ON product_extras
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_extras" ON product_extras
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_extras" ON product_extras
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 5. INVENTORY_ITEMS - Requiere permiso 'inventory'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_insert_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_update_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "owner_delete_inventory_items" ON inventory_items;

CREATE POLICY "owner_or_employee_select_inventory_items" ON inventory_items
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_insert_inventory_items" ON inventory_items
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_update_inventory_items" ON inventory_items
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

CREATE POLICY "owner_or_employee_delete_inventory_items" ON inventory_items
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'inventory')
);

-- ============================================================
-- 6. INVENTORY_MOVEMENTS - Requiere permiso 'inventory'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_insert_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_update_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "owner_delete_inventory_movements" ON inventory_movements;

CREATE POLICY "owner_or_employee_select_inventory_movements" ON inventory_movements
FOR SELECT
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_insert_inventory_movements" ON inventory_movements
FOR INSERT
WITH CHECK (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_update_inventory_movements" ON inventory_movements
FOR UPDATE
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

CREATE POLICY "owner_or_employee_delete_inventory_movements" ON inventory_movements
FOR DELETE
USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  inventory_item_id IN (
    SELECT i.id FROM inventory_items i WHERE has_permission(i.business_id, 'inventory')
  )
);

-- ============================================================
-- 7. PRODUCT_INVENTORY_ITEMS - Requiere permiso 'inventory' o 'products'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_insert_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_update_product_inventory_items" ON product_inventory_items;
DROP POLICY IF EXISTS "owner_delete_product_inventory_items" ON product_inventory_items;

CREATE POLICY "owner_or_employee_select_product_inventory_items" ON product_inventory_items
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_insert_product_inventory_items" ON product_inventory_items
FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_update_product_inventory_items" ON product_inventory_items
FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

CREATE POLICY "owner_or_employee_delete_product_inventory_items" ON product_inventory_items
FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'inventory')
  )
  OR
  product_id IN (
    SELECT p.id FROM products p WHERE has_permission(p.business_id, 'products')
  )
);

-- ============================================================
-- 8. CUSTOMERS - Requiere permiso 'customers'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_customers" ON customers;
DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
DROP POLICY IF EXISTS "owner_update_customers" ON customers;
DROP POLICY IF EXISTS "owner_delete_customers" ON customers;

CREATE POLICY "owner_or_employee_select_customers" ON customers
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_customers" ON customers
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

CREATE POLICY "owner_or_employee_update_customers" ON customers
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

CREATE POLICY "owner_or_employee_delete_customers" ON customers
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'customers')
);

-- ============================================================
-- 9. SALES - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sales" ON sales;
DROP POLICY IF EXISTS "owner_insert_sales" ON sales;
DROP POLICY IF EXISTS "owner_update_sales" ON sales;
DROP POLICY IF EXISTS "owner_delete_sales" ON sales;

CREATE POLICY "owner_or_employee_select_sales" ON sales
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
  OR
  has_permission(business_id, 'reports')
);

CREATE POLICY "owner_or_employee_insert_sales" ON sales
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_update_sales" ON sales
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_delete_sales" ON sales
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- ============================================================
-- 10. SALE_ITEMS - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "owner_delete_sale_items" ON sale_items;

CREATE POLICY "owner_or_employee_select_sale_items" ON sale_items
FOR SELECT
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'reports')
  )
);

CREATE POLICY "owner_or_employee_insert_sale_items" ON sale_items
FOR INSERT
WITH CHECK (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_update_sale_items" ON sale_items
FOR UPDATE
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_id IN (
    SELECT s.id FROM sales s WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_delete_sale_items" ON sale_items
FOR DELETE
USING (
  sale_id IN (
    SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
);

-- ============================================================
-- 11. SALE_ITEM_EXTRAS - Requiere permiso 'pos'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_insert_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_update_sale_item_extras" ON sale_item_extras;
DROP POLICY IF EXISTS "owner_delete_sale_item_extras" ON sale_item_extras;

CREATE POLICY "owner_or_employee_select_sale_item_extras" ON sale_item_extras
FOR SELECT
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'reports')
  )
);

CREATE POLICY "owner_or_employee_insert_sale_item_extras" ON sale_item_extras
FOR INSERT
WITH CHECK (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_update_sale_item_extras" ON sale_item_extras
FOR UPDATE
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE has_permission(s.business_id, 'pos')
  )
);

CREATE POLICY "owner_or_employee_delete_sale_item_extras" ON sale_item_extras
FOR DELETE
USING (
  sale_item_id IN (
    SELECT si.id FROM sale_items si 
    JOIN sales s ON s.id = si.sale_id 
    WHERE s.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
);

-- ============================================================
-- 12. CASH_REGISTERS - Requiere permiso 'cash_register'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_insert_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_update_cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "owner_delete_cash_registers" ON cash_registers;

CREATE POLICY "owner_or_employee_select_cash_registers" ON cash_registers
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_cash_registers" ON cash_registers
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
);

CREATE POLICY "owner_or_employee_update_cash_registers" ON cash_registers
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'cash_register')
);

CREATE POLICY "owner_or_employee_delete_cash_registers" ON cash_registers
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- ============================================================
-- 13. PAYMENT_METHODS - Requiere permiso 'settings'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_insert_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_update_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "owner_delete_payment_methods" ON payment_methods;

CREATE POLICY "owner_or_employee_select_payment_methods" ON payment_methods
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
  OR
  has_permission(business_id, 'pos')
);

CREATE POLICY "owner_or_employee_insert_payment_methods" ON payment_methods
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

CREATE POLICY "owner_or_employee_update_payment_methods" ON payment_methods
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

CREATE POLICY "owner_or_employee_delete_payment_methods" ON payment_methods
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'settings')
);

-- ============================================================
-- 14. EMPLOYEES - Requiere permiso 'employees'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_employees" ON employees;
DROP POLICY IF EXISTS "owner_insert_employees" ON employees;
DROP POLICY IF EXISTS "owner_update_employees" ON employees;
DROP POLICY IF EXISTS "owner_delete_employees" ON employees;

CREATE POLICY "owner_or_employee_select_employees" ON employees
FOR SELECT
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
  OR
  user_id = auth.uid()  -- Empleados pueden ver su propio registro
);

CREATE POLICY "owner_or_employee_insert_employees" ON employees
FOR INSERT
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

CREATE POLICY "owner_or_employee_update_employees" ON employees
FOR UPDATE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

CREATE POLICY "owner_or_employee_delete_employees" ON employees
FOR DELETE
USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  has_permission(business_id, 'employees')
);

-- ============================================================
-- 15. EMPLOYEE_PERMISSIONS - Solo owners o empleados con permiso 'employees'
-- ============================================================
DROP POLICY IF EXISTS "owner_select_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_insert_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_update_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "owner_delete_employee_permissions" ON employee_permissions;

CREATE POLICY "owner_or_manager_select_permissions" ON employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
  OR
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()  -- Ver tus propios permisos
  )
);

CREATE POLICY "owner_or_manager_insert_permissions" ON employee_permissions
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

CREATE POLICY "owner_or_manager_update_permissions" ON employee_permissions
FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

CREATE POLICY "owner_or_manager_delete_permissions" ON employee_permissions
FOR DELETE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  OR
  employee_id IN (
    SELECT e.id FROM employees e WHERE has_permission(e.business_id, 'employees')
  )
);

-- ============================================================
-- Verificar políticas creadas
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'categories', 'product_variants', 'product_extras',
    'inventory_items', 'inventory_movements', 'product_inventory_items',
    'customers', 'sales', 'sale_items', 'sale_item_extras',
    'cash_registers', 'payment_methods', 'employees', 'employee_permissions'
  )
ORDER BY tablename, cmd, policyname;