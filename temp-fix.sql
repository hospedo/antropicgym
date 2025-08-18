-- SOLUCIÓN TEMPORAL para testing - Ejecutar en Supabase
-- Solo para permitir registro, después reactivar RLS

-- Temporalmente deshabilitar RLS para registro
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;

-- Para reactivar después del registro:
-- ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;