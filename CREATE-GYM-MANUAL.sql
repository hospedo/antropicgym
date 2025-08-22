-- CREAR GIMNASIO MANUALMENTE PARA EL USUARIO
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe el gimnasio para este usuario
SELECT 
    'Gimnasios existentes para usuario 19a68c5d-a775-4a35-a21e-4c15b6e32db9:' as info,
    count(*) as total
FROM public.gimnasios 
WHERE usuario_id = '19a68c5d-a775-4a35-a21e-4c15b6e32db9';

-- 2. Ver todos los datos del usuario desde auth.users (metadata)
SELECT 
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users 
WHERE id = '19a68c5d-a775-4a35-a21e-4c15b6e32db9';

-- 3. CREAR EL GIMNASIO manualmente con datos básicos
INSERT INTO public.gimnasios (
    usuario_id,
    nombre,
    direccion,
    telefono,
    email,
    created_at,
    updated_at
) VALUES (
    '19a68c5d-a775-4a35-a21e-4c15b6e32db9',
    'Mi Gimnasio',  -- Cambia por el nombre que quieras
    'Dirección pendiente',
    'Teléfono pendiente', 
    'biros54598@evoxury.com',  -- El email del usuario
    NOW(),
    NOW()
) ON CONFLICT (usuario_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    updated_at = NOW();

-- 4. CREAR EL USUARIO en tabla usuarios también
INSERT INTO public.usuarios (
    id,
    email,
    nombre,
    telefono,
    created_at,
    updated_at
) VALUES (
    '19a68c5d-a775-4a35-a21e-4c15b6e32db9',
    'biros54598@evoxury.com',
    'Usuario Test',  -- Cambia por tu nombre
    'Teléfono pendiente',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 5. Verificar que se crearon correctamente
SELECT 
    'GIMNASIO CREADO:' as info,
    id,
    nombre,
    usuario_id
FROM public.gimnasios 
WHERE usuario_id = '19a68c5d-a775-4a35-a21e-4c15b6e32db9';

SELECT 
    'USUARIO CREADO:' as info,
    id,
    nombre,
    email
FROM public.usuarios 
WHERE id = '19a68c5d-a775-4a35-a21e-4c15b6e32db9';

-- Mensaje de éxito
SELECT 'GIMNASIO Y USUARIO CREADOS - AHORA DEBERÍA FUNCIONAR' as resultado;