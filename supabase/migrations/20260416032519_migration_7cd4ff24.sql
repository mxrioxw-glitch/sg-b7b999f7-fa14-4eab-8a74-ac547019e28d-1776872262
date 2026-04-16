DROP TABLE IF EXISTS employee_permissions CASCADE;

CREATE TABLE employee_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, module)
);

ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_or_manager_select_permissions" ON employee_permissions
FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "owner_or_manager_insert_permissions" ON employee_permissions
FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

CREATE POLICY "owner_or_manager_update_permissions" ON employee_permissions
FOR UPDATE USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

CREATE POLICY "owner_or_manager_delete_permissions" ON employee_permissions
FOR DELETE USING (
  employee_id IN (SELECT id FROM employees WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);