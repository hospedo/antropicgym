-- Crear gimnasio faltante - Ejecutar en Supabase SQL Editor
-- Reemplaza los valores según corresponda

-- Primero verificar si el usuario existe en la tabla usuarios
INSERT INTO public.usuarios (id, email, nombre) 
VALUES ('7f4921b5-11da-45d8-a691-85cc9441da46', 'tu_email@ejemplo.com', 'Tu Nombre')
ON CONFLICT (id) DO NOTHING;

-- Crear el gimnasio asociado
INSERT INTO public.gimnasios (usuario_id, nombre, direccion, telefono, email)
VALUES (
  '7f4921b5-11da-45d8-a691-85cc9441da46',
  'Mi Gimnasio',  -- Cambia por el nombre de tu gimnasio
  'Dirección del gimnasio',  -- Cambia por tu dirección
  '123-456-7890',  -- Cambia por tu teléfono
  'tu_email@ejemplo.com'  -- Cambia por tu email
);