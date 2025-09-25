-- Script para asignar plan básico a lucascoria9.lc@gmail.com
-- Ejecutar esto directamente en Supabase Dashboard > SQL Editor

-- Primero, buscar el usuario por email (para obtener su ID)
-- SELECT id, email FROM auth.users WHERE email = 'lucascoria9.lc@gmail.com';

-- Una vez que tengas el ID del usuario (reemplaza 'USER_ID_AQUI' con el ID real)
-- Insertar o actualizar la suscripción

-- OPCIÓN 1: Si no existe suscripción (INSERT) - PLAN ANUAL
INSERT INTO subscriptions (
    usuario_id,
    status,
    trial_start_date,
    trial_end_date,
    subscription_start_date,
    subscription_end_date,
    last_billing_date,
    next_billing_date,
    payment_method,
    plan_type,
    price_per_user,
    max_users,
    current_users_count
) 
SELECT 
    id as usuario_id,
    'active' as status,
    NOW() as trial_start_date,
    NOW() + INTERVAL '1 year' as trial_end_date,
    NOW() as subscription_start_date,
    NOW() + INTERVAL '1 year' as subscription_end_date,
    NOW() as last_billing_date,
    NOW() + INTERVAL '1 year' as next_billing_date,
    'admin_override' as payment_method,
    'yearly' as plan_type,
    1200 as price_per_user,
    10 as max_users,
    1 as current_users_count
FROM auth.users 
WHERE email = 'lucascoria9.lc@gmail.com'
ON CONFLICT (usuario_id) 
DO UPDATE SET
    status = 'active',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '1 year',
    last_billing_date = NOW(),
    next_billing_date = NOW() + INTERVAL '1 year',
    payment_method = 'admin_override',
    plan_type = 'yearly',
    price_per_user = 1200,
    max_users = 10,
    updated_at = NOW();

-- Verificar el resultado
SELECT 
    u.email,
    s.status,
    s.plan_type,
    s.price_per_user,
    s.payment_method,
    s.next_billing_date,
    s.max_users
FROM auth.users u
JOIN subscriptions s ON u.id = s.usuario_id
WHERE u.email = 'lucascoria9.lc@gmail.com';