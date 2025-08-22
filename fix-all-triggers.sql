-- SCRIPT COMPLETO PARA ELIMINAR TODOS LOS TRIGGERS PROBLEMÁTICOS

-- 1. Eliminar triggers en la tabla usuarios
DROP TRIGGER IF EXISTS on_user_created_subscription ON public.usuarios;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios;

-- 2. Eliminar triggers en la tabla auth.users (este es el probable culpable)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;

-- 3. Eliminar todas las funciones relacionadas
DROP FUNCTION IF EXISTS public.create_subscription_for_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_subscription_for_new_user();

-- 4. Verificar que no hay otros triggers automáticos
-- Ejecutar esta query para ver si hay más triggers:
-- SELECT schemaname, tablename, triggername FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE NOT tgisinternal;

-- 5. Limpiar cualquier política RLS problemática en auth schema
-- (Solo si es necesario)
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;

COMMIT;