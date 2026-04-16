-- Agregar políticas RLS para INSERT y UPDATE en subscriptions

-- Política para crear suscripciones (solo para negocios del usuario)
CREATE POLICY "Users can create subscriptions for their businesses"
ON subscriptions
FOR INSERT
TO public
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Política para actualizar suscripciones (solo para negocios del usuario)
CREATE POLICY "Users can update subscriptions for their businesses"
ON subscriptions
FOR UPDATE
TO public
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);