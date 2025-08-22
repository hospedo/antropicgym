-- EXECUTE THIS IN SUPABASE SQL EDITOR
BEGIN;

-- 1. ELIMINAR TODOS LOS TRIGGERS POSIBLES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_subscription ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios CASCADE;

-- 2. ELIMINAR TODAS LAS FUNCIONES RELACIONADAS
DROP FUNCTION IF EXISTS public.create_subscription_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

-- 3. HABILITAR RLS TEMPORALMENTE PARA PERMITIR INSERTS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. RECREAR POLÍTICAS MÁS PERMISIVAS
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;

-- Política permisiva para usuarios
CREATE POLICY "Allow all operations on usuarios" ON public.usuarios
  FOR ALL USING (true)
  WITH CHECK (true);

-- Política permisiva para gimnasios  
CREATE POLICY "Allow all operations on gimnasios" ON public.gimnasios
  FOR ALL USING (true)
  WITH CHECK (true);

-- Política permisiva para subscriptions
CREATE POLICY "Allow all operations on subscriptions" ON public.subscriptions
  FOR ALL USING (true)
  WITH CHECK (true);

-- 5. VOLVER A HABILITAR RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Confirmar éxito
SELECT 'Sistema limpiado - signup debería funcionar ahora' as resultado;
