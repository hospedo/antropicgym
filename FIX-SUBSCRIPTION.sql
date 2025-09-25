-- Script para arreglar la suscripción de lucascoria9.lc@gmail.com
-- Esto actualiza la suscripción existente para que NO aparezca como expirada

UPDATE subscriptions 
SET 
    status = 'active',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '1 year',
    last_billing_date = NOW(),
    next_billing_date = NOW() + INTERVAL '1 year',
    payment_method = 'admin_override',
    plan_type = 'yearly',
    price_per_user = 1200,
    max_users = 10,
    updated_at = NOW()
WHERE usuario_id = (
    SELECT id FROM auth.users WHERE email = 'lucascoria9.lc@gmail.com'
);

-- Verificar que se aplicó correctamente
SELECT 
    u.email,
    s.status,
    s.plan_type,
    s.price_per_user,
    s.subscription_start_date,
    s.subscription_end_date,
    s.next_billing_date,
    CASE 
        WHEN s.status = 'active' AND (s.subscription_end_date IS NULL OR s.subscription_end_date > NOW()) 
        THEN 'ACTIVA ✅' 
        ELSE 'PROBLEMA ❌' 
    END as estado_verificacion
FROM auth.users u
JOIN subscriptions s ON u.id = s.usuario_id
WHERE u.email = 'lucascoria9.lc@gmail.com';