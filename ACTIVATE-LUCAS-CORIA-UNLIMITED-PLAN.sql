-- Script para activar plan ilimitado para Lucas Coria
-- Gimnasio piloto del sistema - Plan pago e ilimitado

-- 1. Buscar el usuario Lucas Coria
SELECT 
    u.id as usuario_id,
    u.email,
    g.id as gimnasio_id,
    g.nombre as gimnasio_nombre,
    g.created_at as registro_gimnasio
FROM auth.users u
LEFT JOIN gimnasios g ON g.usuario_id = u.id
WHERE u.email ILIKE '%lucas%' AND u.email ILIKE '%coria%'
   OR u.raw_user_meta_data->>'full_name' ILIKE '%lucas%coria%'
ORDER BY u.created_at DESC;

-- 2. Buscar por gimnasio de Lucas Coria
SELECT 
    g.id as gimnasio_id,
    g.nombre,
    g.usuario_id,
    u.email,
    g.created_at
FROM gimnasios g
JOIN auth.users u ON u.id = g.usuario_id
WHERE g.nombre ILIKE '%lucas%' 
   OR g.nombre ILIKE '%coria%'
ORDER BY g.created_at DESC;

-- 3. Verificar suscripción actual (si existe)
SELECT 
    s.*,
    u.email,
    g.nombre as gimnasio_nombre
FROM subscriptions s
JOIN auth.users u ON u.id = s.usuario_id
LEFT JOIN gimnasios g ON g.id = s.gimnasio_id
WHERE u.email ILIKE '%lucas%' AND u.email ILIKE '%coria%'
   OR g.nombre ILIKE '%lucas%' OR g.nombre ILIKE '%coria%';

-- 4. ACTIVAR PLAN ILIMITADO PARA LUCAS CORIA
-- Reemplazar {USER_ID} y {GIMNASIO_ID} con los valores correctos encontrados arriba

/*
-- 4a. Si NO tiene suscripción, crear una nueva
INSERT INTO subscriptions (
    usuario_id,
    gimnasio_id,
    status,
    plan_type,
    price_per_user,
    max_users,
    current_users_count,
    trial_start_date,
    trial_end_date,
    subscription_start_date,
    subscription_end_date,
    last_billing_date,
    next_billing_date,
    payment_method,
    created_at,
    updated_at
) VALUES (
    '{USER_ID}',                           -- ID del usuario Lucas Coria
    '{GIMNASIO_ID}',                       -- ID del gimnasio
    'active',                              -- Estado activo
    'yearly',                              -- Plan anual
    0,                                     -- Sin costo (plan piloto)
    999999,                                -- Usuarios ilimitados
    1,                                     -- Usuario actual (Lucas)
    NOW(),                                 -- Trial desde hoy
    NOW() + INTERVAL '365 days',          -- Trial extendido 1 año
    NOW(),                                 -- Suscripción desde hoy
    NOW() + INTERVAL '10 years',          -- Válido por 10 años (prácticamente ilimitado)
    NOW(),                                 -- Último cobro (ficticio)
    NOW() + INTERVAL '1 year',            -- Próximo cobro en 1 año (ficticio)
    'pilot_program',                       -- Método de pago especial
    NOW(),
    NOW()
);

-- 4b. Si YA tiene suscripción, actualizar a plan ilimitado
UPDATE subscriptions 
SET 
    status = 'active',
    plan_type = 'yearly',
    price_per_user = 0,                    -- Sin costo
    max_users = 999999,                    -- Usuarios ilimitados
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '10 years', -- 10 años de acceso
    last_billing_date = NOW(),
    next_billing_date = NOW() + INTERVAL '1 year',
    payment_method = 'pilot_program',
    updated_at = NOW()
WHERE usuario_id = '{USER_ID}';
*/

-- 5. Verificar que la activación fue exitosa
SELECT 
    s.*,
    u.email,
    g.nombre as gimnasio_nombre,
    CASE 
        WHEN s.status = 'active' AND s.subscription_end_date > NOW() 
        THEN '✅ PLAN ACTIVO E ILIMITADO'
        ELSE '❌ PLAN NO ACTIVADO CORRECTAMENTE'
    END as estado_final,
    EXTRACT(DAYS FROM (s.subscription_end_date - NOW())) as dias_restantes
FROM subscriptions s
JOIN auth.users u ON u.id = s.usuario_id
LEFT JOIN gimnasios g ON g.id = s.gimnasio_id
WHERE s.usuario_id = '{USER_ID}';

-- 6. Mensaje de confirmación
SELECT 
    '🎉 PLAN PILOTO ACTIVADO PARA LUCAS CORIA' as mensaje,
    '✅ Usuarios ilimitados' as usuarios,
    '✅ 10 años de acceso' as duracion,
    '✅ Sin costo (programa piloto)' as precio,
    '✅ Todas las funcionalidades premium' as funciones;