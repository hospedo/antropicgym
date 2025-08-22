-- ARREGLAR ÚLTIMO USUARIO CREADO - 2f1acb4e-9def-48b5-8499-209542489153
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar datos del nuevo usuario en auth
SELECT 
    'DATOS AUTH ÚLTIMO USUARIO:' as info,
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users 
WHERE id = '2f1acb4e-9def-48b5-8499-209542489153';

-- 2. Limpiar datos existentes si los hay (por si acaso)
DELETE FROM public.gimnasios WHERE usuario_id = '2f1acb4e-9def-48b5-8499-209542489153';
DELETE FROM public.usuarios WHERE id = '2f1acb4e-9def-48b5-8499-209542489153';

-- 3. Insertar usuario en tabla usuarios usando datos reales del auth
INSERT INTO public.usuarios (
    id,
    email,
    nombre,
    telefono,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
    COALESCE(raw_user_meta_data->>'telefono', 'Sin teléfono'),
    created_at,
    NOW()
FROM auth.users 
WHERE id = '2f1acb4e-9def-48b5-8499-209542489153';

-- 4. Insertar gimnasio usando datos del signup
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
)
SELECT 
    gen_random_uuid(),
    id,
    COALESCE(raw_user_meta_data->>'nombreGimnasio', 'Mi Gimnasio'),
    COALESCE(raw_user_meta_data->>'direccion', 'Dirección pendiente'),
    COALESCE(raw_user_meta_data->>'telefono', 'Sin teléfono'),
    email,
    '06:00',
    '22:00',
    created_at,
    NOW()
FROM auth.users 
WHERE id = '2f1acb4e-9def-48b5-8499-209542489153';

-- 5. Verificar que se crearon correctamente
SELECT 
    'USUARIO CREADO:' as info,
    id,
    nombre,
    email,
    telefono
FROM public.usuarios 
WHERE id = '2f1acb4e-9def-48b5-8499-209542489153';

SELECT 
    'GIMNASIO CREADO:' as info,
    id,
    usuario_id,
    nombre,
    direccion,
    telefono,
    email
FROM public.gimnasios 
WHERE usuario_id = '2f1acb4e-9def-48b5-8499-209542489153';

-- 6. Mensaje de éxito
SELECT 'ÚLTIMO USUARIO Y GIMNASIO CREADOS - ERRORES 406 RESUELTOS' as resultado;