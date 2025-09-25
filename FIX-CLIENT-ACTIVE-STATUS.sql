-- Script para arreglar el estado 'activo' de todos los clientes
-- basándose en si tienen inscripciones vigentes

-- 1. Ver clientes con problemas de estado
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    c.activo as estado_actual_bd,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM inscripciones i 
            WHERE i.cliente_id = c.id 
            AND i.estado = 'activa' 
            AND i.fecha_fin >= CURRENT_DATE
        ) THEN true 
        ELSE false 
    END as deberia_estar_activo,
    CASE 
        WHEN c.activo != (
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM inscripciones i 
                    WHERE i.cliente_id = c.id 
                    AND i.estado = 'activa' 
                    AND i.fecha_fin >= CURRENT_DATE
                ) THEN true 
                ELSE false 
            END
        ) THEN '⚠️ INCONSISTENCIA'
        ELSE '✅ OK'
    END as estado_problema
FROM clientes c
ORDER BY c.apellido, c.nombre;

-- 2. Corregir estados de clientes basándose en inscripciones vigentes
UPDATE clientes 
SET 
    activo = CASE 
        WHEN EXISTS (
            SELECT 1 FROM inscripciones i 
            WHERE i.cliente_id = clientes.id 
            AND i.estado = 'activa' 
            AND i.fecha_fin >= CURRENT_DATE
            AND i.fecha_inicio IS NOT NULL
            AND i.fecha_fin IS NOT NULL
        ) THEN true 
        ELSE false 
    END,
    updated_at = NOW()
WHERE 
    -- Solo actualizar clientes que tienen el estado incorrecto
    activo != (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM inscripciones i 
                WHERE i.cliente_id = clientes.id 
                AND i.estado = 'activa' 
                AND i.fecha_fin >= CURRENT_DATE
                AND i.fecha_inicio IS NOT NULL
                AND i.fecha_fin IS NOT NULL
            ) THEN true 
            ELSE false 
        END
    );

-- 3. Verificar resultados después de la corrección
SELECT 
    'Clientes activos con planes vigentes' as descripcion,
    COUNT(*) as cantidad
FROM clientes c
WHERE c.activo = true
AND EXISTS (
    SELECT 1 FROM inscripciones i 
    WHERE i.cliente_id = c.id 
    AND i.estado = 'activa' 
    AND i.fecha_fin >= CURRENT_DATE
)

UNION ALL

SELECT 
    'Clientes inactivos sin planes vigentes' as descripcion,
    COUNT(*) as cantidad
FROM clientes c
WHERE c.activo = false
AND NOT EXISTS (
    SELECT 1 FROM inscripciones i 
    WHERE i.cliente_id = c.id 
    AND i.estado = 'activa' 
    AND i.fecha_fin >= CURRENT_DATE
)

UNION ALL

SELECT 
    '⚠️ Clientes con estado inconsistente' as descripcion,
    COUNT(*) as cantidad
FROM clientes c
WHERE c.activo != (
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM inscripciones i 
            WHERE i.cliente_id = c.id 
            AND i.estado = 'activa' 
            AND i.fecha_fin >= CURRENT_DATE
        ) THEN true 
        ELSE false 
    END
);

-- 4. Caso específico: Revisar Vanesa Sosa
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    c.activo as estado_bd,
    i.estado as estado_inscripcion,
    i.fecha_inicio,
    i.fecha_fin,
    p.nombre as plan_nombre,
    CASE 
        WHEN i.estado = 'activa' AND i.fecha_fin >= CURRENT_DATE 
        THEN '✅ PLAN VIGENTE' 
        ELSE '❌ PLAN NO VIGENTE' 
    END as validez_plan
FROM clientes c
LEFT JOIN inscripciones i ON c.id = i.cliente_id
LEFT JOIN planes p ON i.plan_id = p.id
WHERE c.nombre ILIKE '%vanesa%' 
AND c.apellido ILIKE '%sosa%'
ORDER BY i.fecha_fin DESC;