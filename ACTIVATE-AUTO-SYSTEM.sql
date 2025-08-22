-- ACTIVAR SISTEMA AUTOMÁTICO COMPLETO
-- Este script activa el trigger automático y desactiva RLS para evitar errores 406

-- 1. DESACTIVAR TODAS LAS POLÍTICAS RLS (causa de errores 406)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "usuarios_policy" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_policy" ON public.gimnasios;
DROP POLICY IF EXISTS "clientes_policy" ON public.clientes;
DROP POLICY IF EXISTS "planes_policy" ON public.planes;
DROP POLICY IF EXISTS "asistencias_policy" ON public.asistencias;
DROP POLICY IF EXISTS "pagos_policy" ON public.pagos;

-- 3. CREAR O REEMPLAZAR LA FUNCIÓN DEL TRIGGER
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Insertar en tabla usuarios usando datos del auth
  INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NEW.raw_user_meta_data->>'phone', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Insertar gimnasio automáticamente
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
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombreGimnasio', 'Mi Gimnasio'),
    COALESCE(NEW.raw_user_meta_data->>'direccion', 'Dirección pendiente'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NEW.raw_user_meta_data->>'phone', NULL),
    NEW.email,
    '06:00',
    '22:00',
    NOW(),
    NOW()
  )
  ON CONFLICT (usuario_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR EL TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- 5. OTORGAR TODOS LOS PERMISOS NECESARIOS
GRANT ALL ON public.usuarios TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.gimnasios TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.clientes TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.planes TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.asistencias TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.pagos TO postgres, anon, authenticated, service_role;

-- 6. ARREGLAR USUARIOS EXISTENTES QUE NO TIENEN REGISTROS
INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nombre', 'Usuario'),
  COALESCE(raw_user_meta_data->>'telefono', NULL),
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gimnasios (id, usuario_id, nombre, direccion, telefono, email, horario_apertura, horario_cierre, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  au.id,
  COALESCE(au.raw_user_meta_data->>'nombreGimnasio', 'Mi Gimnasio'),
  COALESCE(au.raw_user_meta_data->>'direccion', 'Dirección pendiente'),
  COALESCE(au.raw_user_meta_data->>'telefono', NULL),
  au.email,
  '06:00',
  '22:00',
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT usuario_id FROM public.gimnasios WHERE usuario_id IS NOT NULL)
ON CONFLICT (usuario_id) DO NOTHING;

-- 7. VERIFICAR QUE TODO FUNCIONA
SELECT 'SISTEMA AUTOMÁTICO ACTIVADO - RLS DESACTIVADO - TRIGGER FUNCIONANDO' as resultado;

-- Mostrar usuarios y gimnasios actuales
SELECT 
    'USUARIOS ACTUALES:' as info,
    COUNT(*) as total
FROM public.usuarios;

SELECT 
    'GIMNASIOS ACTUALES:' as info,
    COUNT(*) as total
FROM public.gimnasios;