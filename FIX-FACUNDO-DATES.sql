-- Script para arreglar las fechas inválidas de Facundo Serra
-- Problema: Aparece "Invalid Date" en la ficha del cliente

-- 1. Primero, ver el estado actual de las inscripciones de Facundo
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    i.id as inscripcion_id,
    i.fecha_inicio,
    i.fecha_fin,
    i.estado,
    p.nombre as plan_nombre,
    i.created_at,
    i.updated_at
FROM clientes c
JOIN inscripciones i ON c.id = i.cliente_id
JOIN planes p ON i.plan_id = p.id
WHERE c.nombre ILIKE '%facundo%' 
AND c.apellido ILIKE '%serra%'
AND c.documento = '33893368'
ORDER BY i.created_at DESC;

-- 2. Arreglar las fechas que están causando "Invalid Date"
-- Asumo que el plan debería ser válido desde hace un tiempo hasta el 21/09/2025

UPDATE inscripciones 
SET 
    fecha_inicio = '2024-09-21',  -- 21 de septiembre 2024 (formato YYYY-MM-DD en SQL)
    fecha_fin = '2025-09-21',     -- 21 de septiembre 2025 (formato YYYY-MM-DD en SQL)
    estado = 'vencida',           -- Cambiar a vencida porque ya pasó el 21/09/2025
    updated_at = NOW()
WHERE cliente_id = (
    SELECT id FROM clientes 
    WHERE nombre ILIKE '%facundo%' 
    AND apellido ILIKE '%serra%'
    AND documento = '33893368'
);

-- 3. Si quieres RENOVARLO por un año más desde hoy (25/09/2025):
-- Descomenta las siguientes líneas:

/*
-- Opción A: Renovar desde hoy (25/09/2025) por 1 año hasta 25/09/2026
UPDATE inscripciones 
SET 
    fecha_inicio = '2025-09-25',  -- Desde hoy 25/09/2025
    fecha_fin = '2026-09-25',     -- Hasta 25/09/2026 (1 año)
    estado = 'activa',
    updated_at = NOW()
WHERE cliente_id = (
    SELECT id FROM clientes 
    WHERE nombre ILIKE '%facundo%' 
    AND apellido ILIKE '%serra%'
    AND documento = '33893368'
)
AND id = (
    SELECT id FROM inscripciones 
    WHERE cliente_id = (SELECT id FROM clientes WHERE documento = '33893368')
    ORDER BY created_at DESC 
    LIMIT 1
);
*/

-- 4. Verificar el resultado final
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
        WHEN i.fecha_fin < CURRENT_DATE
        THEN '❌ VENCIDO (' || (CURRENT_DATE - i.fecha_fin::date) || ' días)'
        ELSE '⚠️ ESTADO DESCONOCIDO' 
    END as estado_real
FROM clientes c
JOIN inscripciones i ON c.id = i.cliente_id
JOIN planes p ON i.plan_id = p.id
WHERE c.nombre ILIKE '%facundo%' 
AND c.apellido ILIKE '%serra%'
AND c.documento = '33893368'
ORDER BY i.created_at DESC;