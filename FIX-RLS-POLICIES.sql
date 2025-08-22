-- FIX RLS POLICIES - Execute this in Supabase SQL Editor to fix 406 errors

BEGIN;

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to insert gym" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow gym owners to view their gym" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow gym owners to update their gym" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow all operations on gimnasios" ON public.gimnasios;

DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow users to view their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations on usuarios" ON public.usuarios;

DROP POLICY IF EXISTS "Allow authenticated users to insert subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow users to view their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow users to update their subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;

-- 2. Create working RLS policies

-- USUARIOS table policies
CREATE POLICY "usuarios_insert_policy" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "usuarios_select_policy" ON public.usuarios
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "usuarios_update_policy" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- GIMNASIOS table policies  
CREATE POLICY "gimnasios_insert_policy" ON public.gimnasios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "gimnasios_select_policy" ON public.gimnasios
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "gimnasios_update_policy" ON public.gimnasios
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- SUBSCRIPTIONS table policies
CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "subscriptions_select_policy" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "subscriptions_update_policy" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- 3. Ensure RLS is enabled
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.usuarios TO authenticated;
GRANT ALL ON public.gimnasios TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;

COMMIT;

-- Verify policies are working
SELECT 'RLS policies fixed successfully!' as status;