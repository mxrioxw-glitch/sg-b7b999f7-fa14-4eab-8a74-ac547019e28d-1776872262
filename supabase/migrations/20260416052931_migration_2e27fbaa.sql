-- Drop the policy if it exists first, then create it
DROP POLICY IF EXISTS "service_role_can_insert_employees" ON employees;

CREATE POLICY "service_role_can_insert_employees"
ON employees
FOR INSERT
TO service_role
WITH CHECK (true);