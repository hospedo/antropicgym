-- ARREGLAR AISLAMIENTO DE USUARIOS - EJECUTAR EN SUPABASE SQL EDITOR
-- Este script crea políticas RLS seguras que aíslan usuarios correctamente

BEGIN;

-- 1. Remover las políticas demasiado permisivas
DROP POLICY IF EXISTS "usuarios_authenticated_all" ON public.usuarios;
DROP POLICY IF EXISTS "gimnasios_authenticated_all" ON public.gimnasios;
DROP POLICY IF EXISTS "subscriptions_authenticated_all" ON public.subscriptions;

-- Remover cualquier otra política problemática
DROP POLICY IF EXISTS "Allow all operations on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations on gimnasios" ON public.gimnasios;
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;

-- 2. POLÍTICAS PARA USUARIOS - Solo su propio perfil
CREATE POLICY "usuarios_own_profile" ON public.usuarios
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 3. POLÍTICAS PARA GIMNASIOS - Solo sus propios gimnasios
CREATE POLICY "gimnasios_owner_access" ON public.gimnasios
  FOR ALL
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- 4. POLÍTICAS PARA CLIENTES - Solo clientes de sus gimnasios
CREATE POLICY "clientes_gym_owner_access" ON public.clientes
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

-- 5. POLÍTICAS PARA PLANES - Solo planes de sus gimnasios
CREATE POLICY "planes_gym_owner_access" ON public.planes
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

-- 6. POLÍTICAS PARA ASISTENCIAS - Solo asistencias de clientes de sus gimnasios
CREATE POLICY "asistencias_gym_owner_access" ON public.asistencias
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

-- 7. POLÍTICAS PARA INSCRIPCIONES - Solo inscripciones de clientes de sus gimnasios
CREATE POLICY "inscripciones_gym_owner_access" ON public.inscripciones
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

-- 8. POLÍTICAS PARA PAGOS - Solo pagos de clientes de sus gimnasios
CREATE POLICY "pagos_gym_owner_access" ON public.pagos
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

-- 9. POLÍTICAS PARA SUBSCRIPTIONS - Solo sus propias suscripciones
CREATE POLICY "subscriptions_owner_access" ON public.subscriptions
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
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'SECURE - Uses auth.uid()'
    WHEN qual = 'true' THEN 'INSECURE - Allows all access'
    ELSE 'PARTIAL - ' || LEFT(qual, 50)
  END as security_level
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;