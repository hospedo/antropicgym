-- VERIFICAR ESTRUCTURA DE TABLAS - EJECUTAR PRIMERO
-- Este script verifica qué columnas existen en cada tabla

-- Ver estructura de la tabla usuarios
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver estructura de la tabla gimnasios
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gimnasios'
ORDER BY ordinal_position;

-- Ver estructura de la tabla subscriptions
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Ver estructura de la tabla clientes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clientes'
ORDER BY ordinal_position;

-- Ver políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;