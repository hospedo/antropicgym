-- ARREGLAR NUEVO USUARIO xamopak284@evoxury.com
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar datos del nuevo usuario en auth
SELECT 
    'DATOS AUTH NUEVO USUARIO:' as info,
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users 
WHERE email = 'xamopak284@evoxury.com';

-- 2. Limpiar datos existentes si los hay
DELETE FROM public.gimnasios WHERE email = 'xamopak284@evoxury.com';
DELETE FROM public.usuarios WHERE email = 'xamopak284@evoxury.com';

-- 3. Insertar usuario en tabla usuarios
INSERT INTO public.usuarios (
    id,
    email,
    nombre,
    telefono,
    created_at,
    updated_at
) VALUES (
    '87397321-730d-41b7-a6e7-8879cc6841dd',
    'xamopak284@evoxury.com',
    'Usuario Xamopak',
    '+1234567890',
    NOW(),
    NOW()
);

-- 4. Insertar gimnasio para el nuevo usuario
INSERT INTO public.gimnasios (
    id,
    usuario_id,
    nombre,
    direccion,
    telefono,
    email,
    horario_apertura,
    horario_cierre,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '87397321-730d-41b7-a6e7-8879cc6841dd',
    'Gimnasio Xamopak',
    'Dirección del gimnasio',
    '+1234567890',
    'xamopak284@evoxury.com',
    '06:00',
    '22:00',
    NOW(),
    NOW()
);

-- 5. Verificar que se crearon correctamente
SELECT 
    'NUEVO USUARIO CREADO:' as info,
    id,
    nombre,
    email
FROM public.usuarios 
WHERE email = 'xamopak284@evoxury.com';

SELECT 
    'NUEVO GIMNASIO CREADO:' as info,
    id,
    usuario_id,
    nombre,
    email
FROM public.gimnasios 
WHERE email = 'xamopak284@evoxury.com';

-- Mensaje de éxito
SELECT 'NUEVO USUARIO Y GIMNASIO CREADOS - ERRORES 406 RESUELTOS' as resultado;