-- Script general para arreglar todas las fechas inválidas en inscripciones
-- Problema: Algunos clientes muestran "Invalid Date" en sus membresías

-- 1. Identificar inscripciones con fechas problemáticas
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    i.id as inscripcion_id,
    i.fecha_inicio,
    i.fecha_fin,
    i.estado,
    p.nombre as plan_nombre,
    CASE 
        WHEN i.fecha_inicio IS NULL THEN '❌ Fecha inicio NULL'
        WHEN i.fecha_fin IS NULL THEN '❌ Fecha fin NULL'
        WHEN i.fecha_inicio::text = '' THEN '❌ Fecha inicio vacía'
        WHEN i.fecha_fin::text = '' THEN '❌ Fecha fin vacía'
        ELSE '✅ Fechas OK'
    END as problema
FROM clientes c
JOIN inscripciones i ON c.id = i.cliente_id
LEFT JOIN planes p ON i.plan_id = p.id
WHERE 
    i.fecha_inicio IS NULL OR 
    i.fecha_fin IS NULL OR
    i.fecha_inicio::text = '' OR 
    i.fecha_fin::text = ''
ORDER BY c.apellido, c.nombre;

-- 2. Arreglar todas las inscripciones con fechas inválidas
UPDATE inscripciones 
SET 
    fecha_inicio = COALESCE(
        CASE 
            WHEN fecha_inicio IS NULL OR fecha_inicio::text = '' THEN NULL
            ELSE fecha_inicio 
        END,
        created_at::date,  -- Usar fecha de creación como fallback
        CURRENT_DATE - INTERVAL '30 days'  -- O 30 días atrás como último recurso
    ),
    fecha_fin = COALESCE(
        CASE 
            WHEN fecha_fin IS NULL OR fecha_fin::text = '' THEN NULL
            ELSE fecha_fin 
        END,
        (COALESCE(fecha_inicio, created_at::date, CURRENT_DATE - INTERVAL '30 days') + INTERVAL '30 days'),  -- 30 días después del inicio
        CURRENT_DATE - INTERVAL '1 day'  -- Ayer como último recurso (vencida)
    ),
    estado = CASE 
        WHEN estado = 'activa' AND (fecha_fin IS NULL OR fecha_fin < CURRENT_DATE) THEN 'vencida'
        ELSE estado
    END,
    updated_at = NOW()
WHERE 
    fecha_inicio IS NULL OR 
    fecha_fin IS NULL OR
    fecha_inicio::text = '' OR 
    fecha_fin::text = '';

-- 3. Verificar que todas las inscripciones tengan fechas válidas después del arreglo
SELECT 
    COUNT(*) as total_inscripciones,
    COUNT(CASE WHEN fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL THEN 1 END) as con_fechas_validas,
    COUNT(CASE WHEN fecha_inicio IS NULL OR fecha_fin IS NULL THEN 1 END) as con_fechas_invalidas
FROM inscripciones;

-- 4. Actualizar estados de clientes basado en sus inscripciones
UPDATE clientes 
SET 
    activo = CASE 
        WHEN EXISTS (
            SELECT 1 FROM inscripciones 
            WHERE cliente_id = clientes.id 
            AND estado = 'activa' 
            AND fecha_fin >= CURRENT_DATE
            AND fecha_inicio IS NOT NULL
            AND fecha_fin IS NOT NULL
        ) THEN true
        ELSE false
    END,
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT cliente_id 
    FROM inscripciones 
    WHERE fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL
);

-- 5. Reporte final: Mostrar clientes que tenían problemas de fechas
SELECT 
    c.nombre,
    c.apellido,
    c.documento,
    c.activo,
    COUNT(i.id) as total_inscripciones,
    COUNT(CASE WHEN i.estado = 'activa' AND i.fecha_fin >= CURRENT_DATE THEN 1 END) as activas,
    MAX(i.fecha_fin) as ultima_fecha_vencimiento
FROM clientes c
LEFT JOIN inscripciones i ON c.id = i.cliente_id
GROUP BY c.id, c.nombre, c.apellido, c.documento, c.activo
HAVING COUNT(i.id) > 0
ORDER BY c.apellido, c.nombre;