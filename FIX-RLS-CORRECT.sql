-- SCRIPT CORREGIDO PARA ARREGLAR RLS - EJECUTAR EN SUPABASE SQL EDITOR
BEGIN;

-- 1. Remover todas las políticas problemáticas
DROP POLICY IF EXISTS "usuarios_authenticated_all" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_authenticated_all" ON public.gimnasios;
DROP POLICY IF EXISTS "subscriptions_authenticated_all" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all operations on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations on gimnasios" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "usuarios_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_owner_access" ON public.gimnasios;
DROP POLICY IF EXISTS "clientes_gym_owner_access" ON public.clientes;
DROP POLICY IF EXISTS "subscriptions_owner_access" ON public.subscriptions;

-- 2. POLÍTICA PARA USUARIOS (usando la columna 'id' que existe)
CREATE POLICY "usuarios_own_data" ON public.usuarios
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. POLÍTICA PARA GIMNASIOS (usando usuario_id)
CREATE POLICY "gimnasios_owner_only" ON public.gimnasios
  FOR ALL
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- 4. POLÍTICA PARA CLIENTES (solo clientes de gimnasios del usuario)
CREATE POLICY "clientes_gym_owner_only" ON public.clientes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gimnasios 
      WHERE gimnasios.id = clientes.gimnasio_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gimnasios 
      WHERE gimnasios.id = clientes.gimnasio_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  );

-- 5. POLÍTICA PARA PLANES
CREATE POLICY "planes_gym_owner_only" ON public.planes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gimnasios 
      WHERE gimnasios.id = planes.gimnasio_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gimnasios 
      WHERE gimnasios.id = planes.gimnasio_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  );

-- 6. POLÍTICA PARA ASISTENCIAS
CREATE POLICY "asistencias_gym_owner_only" ON public.asistencias
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = asistencias.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = asistencias.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  );

-- 7. POLÍTICA PARA INSCRIPCIONES
CREATE POLICY "inscripciones_gym_owner_only" ON public.inscripciones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = inscripciones.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = inscripciones.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  );

-- 8. POLÍTICA PARA PAGOS
CREATE POLICY "pagos_gym_owner_only" ON public.pagos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = pagos.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes 
      JOIN public.gimnasios ON clientes.gimnasio_id = gimnasios.id
      WHERE clientes.id = pagos.cliente_id 
      AND gimnasios.usuario_id = auth.uid()
    )
  );

-- 9. POLÍTICA PARA SUBSCRIPTIONS (si existe la tabla)
CREATE POLICY "subscriptions_user_only" ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'SECURE'
    WHEN qual = 'true' THEN 'INSECURE'
    ELSE 'PARTIAL'
  END as security_level
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('usuarios', 'gimnasios', 'clientes', 'planes', 'asistencias', 'inscripciones', 'pagos', 'subscriptions')
ORDER BY tablename, policyname;