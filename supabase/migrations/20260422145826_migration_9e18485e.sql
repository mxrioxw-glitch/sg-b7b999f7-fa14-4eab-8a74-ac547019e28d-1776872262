-- Crear función que se ejecuta automáticamente cuando se confirma un email
CREATE OR REPLACE FUNCTION handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Solo ejecutar si el email acaba de ser confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Verificar que el usuario no sea super admin
    IF NEW.email != 'mxrioxw@gmail.com' THEN
      
      -- Verificar que no tenga negocio ya
      IF NOT EXISTS (SELECT 1 FROM businesses WHERE owner_id = NEW.id) THEN
        
        -- Crear negocio
        INSERT INTO businesses (
          owner_id,
          name,
          slug
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'),
          'negocio-' || EXTRACT(EPOCH FROM NOW())::TEXT
        ) RETURNING id INTO v_business_id;
        
        -- Crear suscripción trial
        v_trial_end := NOW() + INTERVAL '7 days';
        INSERT INTO subscriptions (
          business_id,
          plan,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end
        ) VALUES (
          v_business_id,
          'premium',
          'trialing',
          'monthly',
          NOW(),
          v_trial_end,
          NOW(),
          v_trial_end
        );
        
        -- Crear empleado owner
        INSERT INTO employees (
          business_id,
          user_id,
          role,
          is_active
        ) VALUES (
          v_business_id,
          NEW.id,
          'owner',
          true
        );
        
        RAISE NOTICE 'Negocio creado automáticamente para user %', NEW.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;

-- Crear trigger que se ejecuta cuando se actualiza auth.users
CREATE TRIGGER on_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verified();