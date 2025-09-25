-- Script para renovar el plan de Facundo Serra
-- Su plan venció el 21/09/2025, necesita renovación

-- OPCIÓN 1: Extender la inscripción existente por 1 año más
UPDATE inscripciones 
SET 
    fecha_fin = '2025-09-21'::date + INTERVAL '1 year',  -- Desde su fecha original + 1 año = 21/09/2026
    estado = 'activa',
    updated_at = NOW()
WHERE cliente_id = (
    SELECT id FROM clientes 
    WHERE nombre ILIKE '%facundo%' 
    AND apellido ILIKE '%serra%'
) 
AND fecha_fin = '2025-09-21';  -- Solo actualizar la que vencía el 21/09/2025

-- OPCIÓN 2: Si prefieres que la renovación empiece desde HOY (25/09/2025)
-- Descomenta las siguientes líneas en lugar de las anteriores:

/*
UPDATE inscripciones 
SET 
    fecha_inicio = CURRENT_DATE,                    -- Desde hoy 25/09/2025
    fecha_fin = CURRENT_DATE + INTERVAL '1 year',   -- Hasta 25/09/2026
    estado = 'activa',
    updated_at = NOW()
WHERE cliente_id = (
    SELECT id FROM clientes 
    WHERE nombre ILIKE '%facundo%' 
    AND apellido ILIKE '%serra%'
) 
AND fecha_fin = '2025-09-21';
*/

-- Verificar el resultado
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    i.fecha_inicio,
    i.fecha_fin,
    i.estado,
    p.nombre as plan_nombre,
    CASE 
        WHEN i.estado = 'activa' AND i.fecha_fin >= CURRENT_DATE 
        THEN '✅ ACTIVO' 
        ELSE '❌ VENCIDO' 
    END as estado_actual
FROM clientes c
JOIN inscripciones i ON c.id = i.cliente_id
JOIN planes p ON i.plan_id = p.id
WHERE c.nombre ILIKE '%facundo%' 
AND c.apellido ILIKE '%serra%'
ORDER BY i.fecha_fin DESC;