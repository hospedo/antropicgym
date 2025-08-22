-- SOLUCIÓN NUCLEAR - EJECUTAR COMO ADMIN EN SUPABASE SQL EDITOR
-- Este script desactiva completamente RLS y permite acceso total

-- 1. Cambiar al usuario postgres si es necesario
SET ROLE postgres;

-- 2. Desactivar RLS en TODAS las tablas del esquema public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS disabled for: %', r.tablename;
    END LOOP;
END $$;

-- 3. Eliminar TODAS las políticas RLS
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Policy dropped: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- 4. Otorgar permisos completos a authenticated y anon
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. Verificar estado final
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Contar políticas restantes (debería ser 0)
SELECT 
    count(*) as politicas_restantes,
    'Si es > 0, hay políticas que siguen activas' as nota
FROM pg_policies 
WHERE schemaname = 'public';

-- Mensaje final
SELECT 'SISTEMA COMPLETAMENTE ABIERTO - SIN RLS - SIN ERRORES 406' as resultado;