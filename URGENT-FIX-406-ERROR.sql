-- URGENT: EXECUTE THIS IN SUPABASE SQL EDITOR TO FIX 406 ERRORS
-- This fixes the gym name saving issue and RLS policy conflicts

BEGIN;

-- 1. Temporarily disable RLS to allow immediate access
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 2. Remove all existing conflicting policies
DROP POLICY IF EXISTS "Allow all operations on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations on gimnasios" ON public.gimnasios;  
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;

-- 3. Create simple, working policies for authenticated users
-- Usuarios policies
CREATE POLICY "usuarios_authenticated_all" ON public.usuarios
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Gimnasios policies  
CREATE POLICY "gimnasios_authenticated_all" ON public.gimnasios
  FOR ALL
  TO authenticated  
  USING (true)
  WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "subscriptions_authenticated_all" ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Re-enable RLS with the working policies
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Confirm success
SELECT 'RLS policies fixed - 406 errors should be resolved' as resultado;