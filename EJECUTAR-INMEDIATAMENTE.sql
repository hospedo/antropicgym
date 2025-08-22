-- EJECUTAR ESTE SCRIPT INMEDIATAMENTE EN SUPABASE SQL EDITOR

-- Eliminar TODOS los triggers que puedan estar causando el error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_subscription ON public.usuarios;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios;

-- Eliminar TODAS las funciones relacionadas
DROP FUNCTION IF EXISTS public.create_subscription_for_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_subscription_for_new_user();

-- Confirmar que se ejecutó correctamente
SELECT 'Triggers eliminados correctamente - prueba signup ahora' as resultado;