-- CREAR TRIGGER AUTOMÁTICO PARA SIGNUP
-- Este trigger creará automáticamente usuario y gimnasio cuando alguien se registre

-- 1. Crear función que se ejecuta automáticamente
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Insertar en tabla usuarios usando datos del auth
  INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', NEW.raw_user_meta_data->>'phone', 'Sin teléfono'),
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
    COALESCE(NEW.raw_user_meta_data->>'telefono', 'Teléfono pendiente'),
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

-- 2. Crear el trigger que se ejecuta en cada signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- 3. Otorgar permisos necesarios para que el trigger funcione
GRANT INSERT, UPDATE ON public.usuarios TO postgres;
GRANT INSERT, UPDATE ON public.gimnasios TO postgres;

-- 4. Probar la función manualmente con usuario existente
SELECT 'TRIGGER CREADO - AHORA CADA SIGNUP CREARÁ AUTOMÁTICAMENTE USUARIO Y GIMNASIO' as resultado;

-- 5. Arreglar usuarios existentes que no tienen gimnasio
INSERT INTO public.usuarios (id, email, nombre, telefono, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nombre', 'Usuario'),
  COALESCE(raw_user_meta_data->>'telefono', 'Sin teléfono'),
  NOW(),
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
  COALESCE(au.raw_user_meta_data->>'telefono', 'Sin teléfono'),
  au.email,
  '06:00',
  '22:00',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT usuario_id FROM public.gimnasios WHERE usuario_id IS NOT NULL)
ON CONFLICT (usuario_id) DO NOTHING;

SELECT 'USUARIOS EXISTENTES TAMBIÉN ARREGLADOS' as resultado_final;