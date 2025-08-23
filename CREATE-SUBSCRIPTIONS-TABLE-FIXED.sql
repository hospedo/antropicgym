-- CREAR TABLA SUBSCRIPTIONS Y INTEGRARLA AL SISTEMA AUTOMÁTICO - VERSION ARREGLADA
-- Este script crea la tabla de suscripciones y actualiza el trigger para crear suscripciones automáticamente

-- 1. CREAR TABLA SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'inactive', 'cancelled', 'expired')),
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    last_billing_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_method VARCHAR(100),
    monthly_price DECIMAL(10,2) DEFAULT 150.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(usuario_id), -- Un usuario solo puede tener una suscripción
    UNIQUE(gimnasio_id) -- Un gimnasio solo puede tener una suscripción
);

-- 2. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_subscriptions_usuario_id ON public.subscriptions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gimnasio_id ON public.subscriptions(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. DESACTIVAR RLS EN LA NUEVA TABLA (consistente con otras tablas)
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. OTORGAR PERMISOS
GRANT ALL ON public.subscriptions TO postgres, anon, authenticated, service_role;

-- 5. ACTUALIZAR LA FUNCIÓN DEL TRIGGER PARA INCLUIR SUSCRIPCIONES
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Insertar en tabla usuarios usando datos del auth
  INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NEW.raw_user_meta_data->>'phone', NULL),
    NOW(),
    NOW()
  );

  -- Insertar gimnasio automáticamente
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
    COALESCE(NEW.raw_user_meta_data->>'telefono', NEW.raw_user_meta_data->>'phone', NULL),
    NEW.email,
    '06:00',
    '22:00',
    NOW(),
    NOW()
  );

  -- Crear suscripción gratuita inicial (trial de 30 días)
  INSERT INTO public.subscriptions (
    usuario_id,
    gimnasio_id,
    status,
    trial_start_date,
    trial_end_date,
    monthly_price,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    g.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    150.00,
    NOW(),
    NOW()
  FROM public.gimnasios g
  WHERE g.usuario_id = NEW.id
  LIMIT 1;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, continuar sin fallar
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR SUSCRIPCIONES PARA USUARIOS EXISTENTES QUE NO LAS TENGAN
INSERT INTO public.subscriptions (
    usuario_id,
    gimnasio_id,
    status,
    trial_start_date,
    trial_end_date,
    monthly_price,
    created_at,
    updated_at
)
SELECT 
    g.usuario_id,
    g.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    150.00,
    NOW(),
    NOW()
FROM public.gimnasios g
WHERE g.usuario_id NOT IN (SELECT usuario_id FROM public.subscriptions WHERE usuario_id IS NOT NULL)
ON CONFLICT (usuario_id) DO NOTHING;

-- 7. FUNCIÓN PARA ACTUALIZAR EL CAMPO updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA ACTUALIZAR updated_at EN SUBSCRIPTIONS
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. VERIFICAR RESULTADOS
SELECT 'TABLA SUBSCRIPTIONS CREADA Y TRIGGER ACTUALIZADO' as resultado;

-- Mostrar estadísticas
SELECT 
    'USUARIOS TOTALES:' as info,
    COUNT(*) as total
FROM public.usuarios;

SELECT 
    'GIMNASIOS TOTALES:' as info,
    COUNT(*) as total
FROM public.gimnasios;

SELECT 
    'SUSCRIPCIONES CREADAS:' as info,
    COUNT(*) as total
FROM public.subscriptions;

-- Verificar que cada usuario tiene su suscripción
SELECT 
    'USUARIOS SIN SUSCRIPCIÓN:' as info,
    COUNT(*) as total
FROM public.usuarios u
WHERE u.id NOT IN (SELECT usuario_id FROM public.subscriptions WHERE usuario_id IS NOT NULL);

-- Mostrar algunas suscripciones creadas
SELECT 
    'SUSCRIPCIONES ACTUALES:' as info,
    s.usuario_id,
    s.status,
    s.trial_start_date::date as inicio_trial,
    s.trial_end_date::date as fin_trial,
    s.monthly_price
FROM public.subscriptions s
LIMIT 5;