-- DESACTIVAR COMPLETAMENTE RLS - EJECUTAR EN SUPABASE SQL EDITOR
-- Este script desactiva RLS en TODAS las tablas y verifica el estado

BEGIN;

-- 1. Verificar estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Desactivar RLS en TODAS las tablas principales
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bug_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitation_codes DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar TODAS las políticas RLS existentes
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 4. Verificar que RLS está desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true;

-- 5. Verificar que no hay políticas RLS
SELECT count(*) as politicas_restantes
FROM pg_policies 
WHERE schemaname = 'public';

COMMIT;

-- Mensaje final
SELECT 'RLS completamente desactivado - sistema debería funcionar sin errores 406' as resultado;