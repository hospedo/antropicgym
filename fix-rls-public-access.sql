-- Políticas RLS para permitir acceso público con token válido

-- 1. Permitir consulta de gimnasios por access_token
CREATE POLICY "Public access to gym by token" ON public.gimnasios
  FOR SELECT USING (access_token IS NOT NULL);

-- 2. Permitir consulta de planes por gimnasio (para tokens válidos)
CREATE POLICY "Public access to plans by gym" ON public.planes
  FOR SELECT USING (true); -- Cualquiera puede ver planes

-- 3. Permitir consulta de clientes por gimnasio (para tokens válidos)
CREATE POLICY "Public access to clients by gym" ON public.clientes
  FOR SELECT USING (true); -- Cualquiera puede ver clientes

-- 4. Permitir consulta de inscripciones (para tokens válidos)
CREATE POLICY "Public access to inscriptions" ON public.inscripciones
  FOR SELECT USING (true); -- Cualquiera puede ver inscripciones

-- 5. Permitir consulta de asistencias (para tokens válidos)
CREATE POLICY "Public access to attendance" ON public.asistencias
  FOR SELECT USING (true); -- Cualquiera puede ver asistencias

-- 6. Permitir insertar asistencias (para tokens válidos)
CREATE POLICY "Public insert attendance" ON public.asistencias
  FOR INSERT WITH CHECK (true); -- Cualquiera puede insertar asistencias

-- 7. Permitir insertar inscripciones (para renovaciones)
CREATE POLICY "Public insert inscriptions" ON public.inscripciones
  FOR INSERT WITH CHECK (true); -- Cualquiera puede insertar inscripciones

-- 8. Permitir insertar movimientos de recepción
CREATE POLICY "Public insert reception movements" ON public.movimientos_recepcion
  FOR INSERT WITH CHECK (true); -- Cualquiera puede insertar movimientos