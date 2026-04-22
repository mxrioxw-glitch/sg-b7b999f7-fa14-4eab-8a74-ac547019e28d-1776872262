-- Crear función que se ejecuta cuando un usuario confirma su email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_business_name TEXT;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Solo proceder si el email acaba de ser confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Obtener el nombre del negocio de los metadatos
    v_business_name := COALESCE(
      NEW.raw_user_meta_data->>'businessName',
      'Mi Negocio'
    );
    
    -- Crear el negocio
    INSERT INTO public.businesses (owner_id, name)
    VALUES (NEW.id, v_business_name)
    RETURNING id INTO v_business_id;
    
    -- Crear suscripción trial (7 días)
    v_trial_end := NOW() + INTERVAL '7 days';
    
    INSERT INTO public.subscriptions (
      business_id,
      plan,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      v_business_id,
      'basic',
      'trialing',
      v_trial_end,
      NOW(),
      v_trial_end
    );
    
    -- Crear registro de empleado owner
    INSERT INTO public.employees (
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
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmation();