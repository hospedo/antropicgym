-- Para eliminar usuario y empezar de nuevo (OPCIONAL)
-- Ejecutar en Supabase SQL Editor

-- Eliminar datos del usuario actual
DELETE FROM public.gimnasios WHERE usuario_id = '7f4921b5-11da-45d8-a691-85cc9441da46';
DELETE FROM public.usuarios WHERE id = '7f4921b5-11da-45d8-a691-85cc9441da46';

-- Después de esto, puedes registrarte de nuevo desde la web