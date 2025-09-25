-- Script para arreglar las fechas inválidas de Facundo Serra (cliente DNI: 33893368)
-- El problema: Las fechas aparecen como "Invalid Date" en la interfaz

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
LEFT JOIN planes p ON i.plan_id = p.id
WHERE c.documento = '33893368'
ORDER BY i.created_at DESC;

-- 2. Arreglar las fechas corruptas
-- Establecer fechas válidas para las inscripciones con fechas inválidas
UPDATE inscripciones 
SET 
    fecha_inicio = CASE 
        WHEN fecha_inicio IS NULL OR fecha_inicio::text = 'null' OR fecha_inicio::text = '' 
        THEN '2024-09-01'::date  -- Fecha de inicio por defecto
        ELSE fecha_inicio 
    END,
    fecha_fin = CASE 
        WHEN fecha_fin IS NULL OR fecha_fin::text = 'null' OR fecha_fin::text = '' 
        THEN '2025-09-01'::date  -- Fecha de fin por defecto (ya vencida)
        ELSE fecha_fin 
    END,
    estado = 'vencida',  -- Marcar como vencida ya que las fechas están corruptas
    updated_at = NOW()
WHERE cliente_id = (
    SELECT id FROM clientes 
    WHERE documento = '33893368'
)
AND (
    fecha_inicio IS NULL OR fecha_inicio::text = 'null' OR fecha_inicio::text = '' OR
    fecha_fin IS NULL OR fecha_fin::text = 'null' OR fecha_fin::text = ''
);

-- 3. Si quieres crear una nueva inscripción activa para Facundo (recomendado):
-- Insertar una nueva inscripción con fechas válidas

-- Primero obtener el ID del cliente y un plan básico
-- (Ajusta el plan_id según los planes disponibles en tu gimnasio)

/*
INSERT INTO inscripciones (
    cliente_id,
    plan_id,
    fecha_inicio,
    fecha_fin,
    estado,
    monto_pagado,
    created_at,
    updated_at
)
SELECT 
    c.id as cliente_id,
    (SELECT id FROM planes WHERE nombre ILIKE '%libre%' OR nombre ILIKE '%basico%' LIMIT 1) as plan_id,
    CURRENT_DATE as fecha_inicio,
    CURRENT_DATE + INTERVAL '30 days' as fecha_fin,  -- 30 días desde hoy
    'activa' as estado,
    (SELECT precio FROM planes WHERE nombre ILIKE '%libre%' OR nombre ILIKE '%basico%' LIMIT 1) as monto_pagado,
    NOW() as created_at,
    NOW() as updated_at
FROM clientes c
WHERE c.documento = '33893368'
AND NOT EXISTS (
    SELECT 1 FROM inscripciones i 
    WHERE i.cliente_id = c.id 
    AND i.estado = 'activa' 
    AND i.fecha_fin >= CURRENT_DATE
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
LEFT JOIN planes p ON i.plan_id = p.id
WHERE c.documento = '33893368'
ORDER BY i.created_at DESC;

-- 5. Actualizar el estado del cliente
UPDATE clientes 
SET 
    activo = CASE 
        WHEN EXISTS (
            SELECT 1 FROM inscripciones 
            WHERE cliente_id = clientes.id 
            AND estado = 'activa' 
            AND fecha_fin >= CURRENT_DATE
        ) THEN true
        ELSE false
    END,
    updated_at = NOW()
WHERE documento = '33893368';