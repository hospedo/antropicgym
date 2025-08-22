-- RESETEO COMPLETO DE SUPABASE - EJECUTAR COMO ADMINISTRADOR
-- Este script hace un reset completo de la configuración RLS

-- 1. Cambiar al rol de administrador
SET ROLE postgres;

-- 2. Desactivar RLS en TODAS las tablas del esquema public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS disabled for: %', r.tablename;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not disable RLS for: % - %', r.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Eliminar TODAS las políticas RLS del esquema public
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
            RAISE NOTICE 'Policy dropped: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not drop policy: % - %', pol.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Otorgar TODOS los permisos necesarios
GRANT ALL PRIVILEGES ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 5. Asegurarse de que no hay restricciones en tablas específicas
ALTER TABLE IF EXISTS public.usuarios OWNER TO postgres;
ALTER TABLE IF EXISTS public.gimnasios OWNER TO postgres;
ALTER TABLE IF EXISTS public.clientes OWNER TO postgres;
ALTER TABLE IF EXISTS public.subscriptions OWNER TO postgres;

-- 6. Crear datos mínimos para el usuario problemático
INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
VALUES (
    '19a68c5d-a775-4a35-a21e-4c15b6e32db9',
    'biros54598@evoxury.com',
    'Usuario Test',
    'Sin teléfono',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

INSERT INTO public.gimnasios (usuario_id, nombre, direccion, telefono, email, created_at, updated_at)
VALUES (
    '19a68c5d-a775-4a35-a21e-4c15b6e32db9',
    'Gimnasio Test',
    'Sin dirección',
    'Sin teléfono',
    'biros54598@evoxury.com',
    NOW(),
    NOW()
) ON CONFLICT (usuario_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    updated_at = NOW();

-- 7. Verificación final
SELECT 'VERIFICACIÓN FINAL:' as info;

SELECT 
    'Tablas sin RLS:' as categoria,
    count(*) as total
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

SELECT 
    'Políticas restantes:' as categoria,
    count(*) as total
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    'Gimnasios del usuario:' as categoria,
    count(*) as total
FROM public.gimnasios 
WHERE usuario_id = '19a68c5d-a775-4a35-a21e-4c15b6e32db9';

-- Mensaje final
SELECT 'RESET COMPLETO TERMINADO - SISTEMA DEBERÍA FUNCIONAR SIN ERRORES 406' as resultado;