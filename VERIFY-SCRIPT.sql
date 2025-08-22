-- VERIFICAR SI EL SCRIPT ANTERIOR FUNCIONÓ
-- Ejecutar para diagnosticar el problema

-- 1. Verificar estado de RLS en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS ACTIVO (PROBLEMA)'
        ELSE '✅ RLS DESACTIVADO (OK)'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Contar políticas RLS restantes
SELECT 
    count(*) as total_policies,
    CASE 
        WHEN count(*) > 0 THEN '❌ HAY POLÍTICAS ACTIVAS (PROBLEMA)'
        ELSE '✅ NO HAY POLÍTICAS (OK)'
    END as estado
FROM pg_policies 
WHERE schemaname = 'public';

-- 3. Listar políticas que siguen activas (si las hay)
SELECT 
    schemaname,
    tablename,
    policyname,
    '❌ ESTA POLÍTICA CAUSA ERRORES 406' as problema
FROM pg_policies 
WHERE schemaname = 'public';

-- 4. Verificar permisos en tabla gimnasios específicamente
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'gimnasios'
AND grantee IN ('authenticated', 'anon', 'postgres');

-- 5. Verificar si la tabla gimnasios existe y es accesible
SELECT 
    'gimnasios' as tabla,
    count(*) as total_records,
    CASE 
        WHEN count(*) >= 0 THEN '✅ TABLA ACCESIBLE'
        ELSE '❌ TABLA INACCESIBLE'
    END as estado
FROM public.gimnasios;