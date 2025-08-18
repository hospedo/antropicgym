-- Verificar datos del usuario y gimnasio
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar usuario en tabla usuarios
SELECT * FROM public.usuarios WHERE id = '7f4921b5-11da-45d8-a691-85cc9441da46';

-- 2. Verificar gimnasio asociado
SELECT * FROM public.gimnasios WHERE usuario_id = '7f4921b5-11da-45d8-a691-85cc9441da46';

-- 3. Verificar usuario en auth.users
SELECT id, email, created_at FROM auth.users WHERE id = '7f4921b5-11da-45d8-a691-85cc9441da46';