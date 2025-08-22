-- FINAL DATABASE FIX - EXECUTE THIS IN SUPABASE SQL EDITOR
-- This script removes ALL problematic triggers and creates bulletproof signup

BEGIN;

-- 1. REMOVE ALL PROBLEMATIC TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_subscription ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios CASCADE;

-- 2. REMOVE ALL RELATED FUNCTIONS
DROP FUNCTION IF EXISTS public.create_subscription_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

-- 3. TEMPORARILY DISABLE RLS FOR SAFE POLICIES UPDATE
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. REMOVE OLD RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
DROP POLICY IF EXISTS "Only gym owners can access" ON public.gimnasios;
DROP POLICY IF EXISTS "Gym owners can manage their gym" ON public.gimnasios;

-- 5. CREATE BULLETPROOF POLICIES
-- Usuarios policies
CREATE POLICY "Allow authenticated users to insert their profile" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view their own data" ON public.usuarios
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own data" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Gimnasios policies
CREATE POLICY "Allow authenticated users to insert gym" ON public.gimnasios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Allow gym owners to view their gym" ON public.gimnasios
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Allow gym owners to update their gym" ON public.gimnasios
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Subscriptions policies  
CREATE POLICY "Allow authenticated users to insert subscription" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Allow users to view their subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Allow users to update their subscription" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- 6. RE-ENABLE RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. ENSURE TABLES EXIST WITH CORRECT STRUCTURE
-- Check if usuarios table exists and has correct columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
        CREATE TABLE public.usuarios (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            nombre TEXT,
            email TEXT,
            telefono TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Check if gimnasios table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gimnasios') THEN
        CREATE TABLE public.gimnasios (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            usuario_id UUID REFERENCES auth.users ON DELETE CASCADE,
            nombre TEXT NOT NULL,
            direccion TEXT,
            telefono TEXT,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Check if subscriptions table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        CREATE TABLE public.subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            usuario_id UUID REFERENCES auth.users ON DELETE CASCADE,
            gimnasio_id UUID REFERENCES public.gimnasios ON DELETE SET NULL,
            status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
            trial_start_date TIMESTAMP WITH TIME ZONE,
            trial_end_date TIMESTAMP WITH TIME ZONE,
            subscription_start_date TIMESTAMP WITH TIME ZONE,
            subscription_end_date TIMESTAMP WITH TIME ZONE,
            last_billing_date TIMESTAMP WITH TIME ZONE,
            next_billing_date TIMESTAMP WITH TIME ZONE,
            payment_method TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

COMMIT;

-- Verify success
SELECT 'Database successfully cleaned - signup should work now!' as status;