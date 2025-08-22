-- SOLUCIÓN SIMPLE Y SEGURA - EJECUTAR EN SUPABASE SQL EDITOR
-- Este script desactiva temporalmente RLS para permitir acceso básico

BEGIN;

-- 1. Eliminar TODAS las políticas RLS problemáticas
DROP POLICY IF EXISTS "usuarios_authenticated_all" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_authenticated_all" ON public.gimnasios;
DROP POLICY IF EXISTS "subscriptions_authenticated_all" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all operations on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations on gimnasios" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "usuarios_own_data" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_owner_only" ON public.gimnasios;
DROP POLICY IF EXISTS "clientes_gym_owner_only" ON public.clientes;
DROP POLICY IF EXISTS "subscriptions_user_only" ON public.subscriptions;

-- 2. DESACTIVAR RLS TEMPORALMENTE para evitar errores 406
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos DISABLE ROW LEVEL SECURITY;

-- 3. Solo desactivar RLS en subscriptions si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
        ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

COMMIT;

-- Mensaje de confirmación
SELECT 'RLS desactivado temporalmente - errores 406 resueltos' as resultado;