-- Crear tabla para gestionar suscripciones y períodos de prueba
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  
  -- Fechas importantes
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Estado de la suscripción
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled', 'suspended')),
  
  -- Información de pago
  plan_type TEXT DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly')),
  price_per_user DECIMAL(10,2) DEFAULT 150.00,
  max_users INTEGER DEFAULT 1,
  current_users_count INTEGER DEFAULT 1,
  
  -- Facturación
  last_billing_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propia suscripción
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que los usuarios puedan actualizar su propia suscripción
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para crear suscripciones (normalmente se hace automáticamente)
CREATE POLICY "Users can create subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Función para calcular días restantes de trial
CREATE OR REPLACE FUNCTION get_trial_days_remaining(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end_date TIMESTAMP WITH TIME ZONE;
  days_remaining INTEGER;
BEGIN
  SELECT s.trial_end_date INTO trial_end_date
  FROM public.subscriptions s
  WHERE s.usuario_id = user_id;
  
  IF trial_end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  days_remaining := EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400;
  RETURN GREATEST(0, FLOOR(days_remaining)::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si el usuario tiene acceso activo
CREATE OR REPLACE FUNCTION has_active_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_status TEXT;
  trial_end_date TIMESTAMP WITH TIME ZONE;
  subscription_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT s.status, s.trial_end_date, s.subscription_end_date
  INTO subscription_status, trial_end_date, subscription_end_date
  FROM public.subscriptions s
  WHERE s.usuario_id = user_id;
  
  IF subscription_status IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Si está en trial y no ha expirado
  IF subscription_status = 'trial' AND trial_end_date > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Si tiene suscripción activa y no ha expirado
  IF subscription_status = 'active' AND (subscription_end_date IS NULL OR subscription_end_date > NOW()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear suscripción automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (usuario_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION create_subscription_for_new_user();

-- Índices para mejorar performance
CREATE INDEX idx_subscriptions_usuario_id ON public.subscriptions(usuario_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_end_date ON public.subscriptions(trial_end_date);
CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);