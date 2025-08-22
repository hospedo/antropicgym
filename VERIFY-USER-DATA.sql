-- VERIFICAR DATOS DEL USUARIO biros54598@evoxury.com
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar datos en auth.users
SELECT 
    'DATOS AUTH.USERS:' as info,
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data,
    user_metadata
FROM auth.users 
WHERE email = 'biros54598@evoxury.com';

-- 2. Verificar datos en tabla usuarios
SELECT 
    'DATOS TABLA USUARIOS:' as info,
    id,
    email,
    nombre,
    telefono,
    created_at
FROM public.usuarios 
WHERE email = 'biros54598@evoxury.com';

-- 3. Verificar datos en tabla gimnasios
SELECT 
    'DATOS TABLA GIMNASIOS:' as info,
    id,
    usuario_id,
    nombre,
    direccion,
    telefono,
    email,
    created_at
FROM public.gimnasios 
WHERE email = 'biros54598@evoxury.com'
   OR usuario_id IN (SELECT id FROM auth.users WHERE email = 'biros54598@evoxury.com');

-- 4. Verificar permisos en tabla gimnasios
SELECT 
    'PERMISOS TABLA GIMNASIOS:' as info,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'gimnasios'
AND grantee IN ('authenticated', 'anon');

-- 5. Verificar estado RLS
SELECT 
    'ESTADO RLS:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('usuarios', 'gimnasios', 'clientes')
ORDER BY tablename;

-- 6. Test directo de consulta
SELECT 
    'TEST CONSULTA GIMNASIOS:' as info,
    count(*) as total_gimnasios
FROM public.gimnasios;