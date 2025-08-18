-- SQL temporal para debug - Ejecutar en Supabase SQL Editor
-- SOLO para testing - NO usar en producción

-- Verificar si las tablas existen
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Temporalmente deshabilitar RLS (SOLO PARA DEBUG)
-- ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
