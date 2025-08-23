-- CREAR TABLA SUBSCRIPTIONS SIMPLE Y FUNCIONAL
-- Este script crea la tabla de suscripciones de forma simple y actualiza el trigger

-- 1. CREAR TABLA SUBSCRIPTIONS (versión simple)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'trial',
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    last_billing_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_method VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(usuario_id)
);

-- 2. DESACTIVAR RLS
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. OTORGAR PERMISOS
GRANT ALL ON public.subscriptions TO postgres, anon, authenticated, service_role;

-- 4. ACTUALIZAR FUNCIÓN DEL TRIGGER
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Insertar usuario
  INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NULL),
    NOW(),
    NOW()
  );

  -- Insertar gimnasio
  INSERT INTO public.gimnasios (
    id, 
    usuario_id, 
    nombre, 
    direccion, 
    telefono, 
    email,
    horario_apertura,
    horario_cierre,
    created_at, 
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombreGimnasio', 'Mi Gimnasio'),
    COALESCE(NEW.raw_user_meta_data->>'direccion', 'Dirección pendiente'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NULL),
    NEW.email,
    '06:00',
    '22:00',
    NOW(),
    NOW()
  );

  -- Crear suscripción trial
  INSERT INTO public.subscriptions (
    usuario_id,
    gimnasio_id,
    status,
    trial_start_date,
    trial_end_date
  )
  SELECT 
    NEW.id,
    g.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days'
  FROM public.gimnasios g
  WHERE g.usuario_id = NEW.id
  LIMIT 1;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR SUSCRIPCIONES PARA USUARIOS EXISTENTES
DO $$
DECLARE
  gym_record RECORD;
BEGIN
  FOR gym_record IN 
    SELECT usuario_id, id as gimnasio_id
    FROM public.gimnasios g
    WHERE g.usuario_id NOT IN (SELECT usuario_id FROM public.subscriptions WHERE usuario_id IS NOT NULL)
  LOOP
    BEGIN
      INSERT INTO public.subscriptions (
        usuario_id,
        gimnasio_id,
        status,
        trial_start_date,
        trial_end_date
      )
      VALUES (
        gym_record.usuario_id,
        gym_record.gimnasio_id,
        'trial',
        NOW(),
        NOW() + INTERVAL '30 days'
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- Continuar con el siguiente
    END;
  END LOOP;
END $$;

-- 6. VERIFICAR RESULTADOS
SELECT 'TABLA SUBSCRIPTIONS CREADA EXITOSAMENTE' as resultado;

SELECT 
    'SUSCRIPCIONES CREADAS:' as info,
    COUNT(*) as total
FROM public.subscriptions;

SELECT 
    'USUARIOS SIN SUSCRIPCIÓN:' as info,
    COUNT(*) as total
FROM public.usuarios u
WHERE u.id NOT IN (SELECT usuario_id FROM public.subscriptions WHERE usuario_id IS NOT NULL);