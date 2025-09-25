-- Script DIRECTO para activar plan ilimitado para Lucas Coria
-- Ejecutar directamente en Supabase Dashboard > SQL Editor

-- Paso 1: Encontrar a Lucas Coria
DO $$
DECLARE
    lucas_user_id uuid;
    lucas_gym_id uuid;
    gym_name text;
    user_email text;
BEGIN
    -- Buscar gimnasio de Lucas
    SELECT id, usuario_id, nombre, email
    INTO lucas_gym_id, lucas_user_id, gym_name, user_email
    FROM gimnasios 
    WHERE nombre ILIKE '%lucas%' 
       OR nombre ILIKE '%coria%'
       OR email ILIKE '%lucas%'
       OR email ILIKE '%coria%'
    LIMIT 1;

    IF lucas_user_id IS NULL THEN
        RAISE NOTICE 'No se encontró gimnasio de Lucas Coria';
        RETURN;
    END IF;

    RAISE NOTICE 'Encontrado: Usuario ID: %, Gimnasio ID: %, Nombre: %, Email: %', 
                 lucas_user_id, lucas_gym_id, gym_name, user_email;

    -- Verificar si ya tiene suscripción
    IF EXISTS (SELECT 1 FROM subscriptions WHERE usuario_id = lucas_user_id) THEN
        -- Actualizar suscripción existente
        UPDATE subscriptions 
        SET 
            status = 'active',
            plan_type = 'yearly',
            price_per_user = 0,
            max_users = 999999,
            subscription_start_date = NOW(),
            subscription_end_date = NOW() + INTERVAL '10 years',
            last_billing_date = NOW(),
            next_billing_date = NOW() + INTERVAL '1 year',
            payment_method = 'pilot_program',
            updated_at = NOW()
        WHERE usuario_id = lucas_user_id;
        
        RAISE NOTICE '✅ Suscripción de Lucas Coria ACTUALIZADA a plan ilimitado';
    ELSE
        -- Crear nueva suscripción
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
            lucas_user_id,
            lucas_gym_id,
            'active',
            'yearly',
            0,
            999999,
            1,
            NOW(),
            NOW() + INTERVAL '10 years',
            NOW(),
            NOW() + INTERVAL '10 years',
            NOW(),
            NOW() + INTERVAL '1 year',
            'pilot_program',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Nueva suscripción CREADA para Lucas Coria - Plan ilimitado';
    END IF;

    -- Mostrar resultado final
    RAISE NOTICE '🎉 PLAN PILOTO ACTIVADO:';
    RAISE NOTICE '👤 Usuario: % (%)', gym_name, user_email;
    RAISE NOTICE '⏰ Válido hasta: %', (NOW() + INTERVAL '10 years')::date;
    RAISE NOTICE '👥 Usuarios máximos: 999,999 (ilimitado)';
    RAISE NOTICE '💰 Costo: $0 (programa piloto)';
    RAISE NOTICE '🏷️ Método de pago: pilot_program';
END $$;

-- Verificar el resultado
SELECT 
    g.nombre as gimnasio,
    g.email as email_gimnasio,
    s.status,
    s.plan_type,
    s.max_users,
    s.price_per_user,
    s.subscription_end_date,
    s.payment_method,
    CASE 
        WHEN s.payment_method = 'pilot_program' AND s.max_users = 999999 
        THEN '🎉 PLAN PILOTO ACTIVO'
        ELSE '⚠️ Verificar configuración'
    END as estado
FROM subscriptions s
JOIN gimnasios g ON g.usuario_id = s.usuario_id
WHERE g.nombre ILIKE '%lucas%' 
   OR g.nombre ILIKE '%coria%'
   OR g.email ILIKE '%lucas%'
   OR g.email ILIKE '%coria%';

-- Mensaje final
SELECT 
    '🚀 LUCAS CORIA ACTIVADO COMO GIMNASIO PILOTO' as mensaje,
    '✅ 10 años de acceso gratuito' as duracion,
    '✅ Usuarios completamente ilimitados' as usuarios,
    '✅ Todas las funcionalidades premium' as funciones,
    '✅ Sin restricciones' as limitaciones;