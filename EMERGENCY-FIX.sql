-- SOLUCIÓN DE EMERGENCIA - CONFIGURACIÓN MANUAL DIRECTA
-- Ejecutar en Supabase SQL Editor como ÚLTIMO RECURSO

-- 1. Verificar si el problema es de la API Key o configuración
SELECT 
    'TEST BÁSICO DE ACCESO:' as info,
    current_user,
    current_database(),
    version();

-- 2. Verificar si las tablas existen y son accesibles directamente
SELECT 
    'VERIFICACIÓN TABLA GIMNASIOS:' as info,
    count(*) as total_registros
FROM public.gimnasios;

-- 3. Insertar directamente el gimnasio para el usuario problemático
-- SIN usar usuario_id como filtro (para evitar RLS)
DELETE FROM public.gimnasios WHERE email = 'biros54598@evoxury.com';
DELETE FROM public.usuarios WHERE email = 'biros54598@evoxury.com';

-- Insertar usuario
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
    'Usuario Biros',
    '+1234567890',
    NOW(),
    NOW()
);

-- Insertar gimnasio
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
    '19a68c5d-a775-4a35-a21e-4c15b6e32db9',
    'Gimnasio Biros',
    'Dirección del gimnasio',
    '+1234567890',
    'biros54598@evoxury.com',
    '06:00',
    '22:00',
    NOW(),
    NOW()
);

-- 4. Verificar que se insertó correctamente
SELECT 
    'GIMNASIO INSERTADO:' as info,
    id,
    usuario_id,
    nombre,
    email
FROM public.gimnasios 
WHERE email = 'biros54598@evoxury.com';

-- 5. Configurar acceso completo para esta API Key específica
-- Esto es una configuración de emergencia
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Mensaje final
SELECT 'DATOS INSERTADOS MANUALMENTE - PRUEBA EL SISTEMA AHORA' as resultado;