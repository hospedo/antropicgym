-- SQL para solucionar el registro de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Crear función para manejar nuevos usuarios automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nombre');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear trigger que se ejecuta cuando se registra un nuevo usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Permitir inserción pública en usuarios (SOLO para el registro inicial)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.usuarios;
CREATE POLICY "Users can insert own profile" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Permitir inserción pública en gimnasios (SOLO para el registro inicial)  
DROP POLICY IF EXISTS "Users can insert own gym" ON public.gimnasios;
CREATE POLICY "Users can insert own gym" ON public.gimnasios
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);