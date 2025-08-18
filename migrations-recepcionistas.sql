-- Migración para sistema de recepcionistas con códigos de autorización
-- Agrega campos para 4 recepcionistas por gimnasio y tabla de movimientos

-- 1. Agregar campos de recepcionistas a tabla gimnasios
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_1_nombre TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_1_password TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_2_nombre TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_2_password TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_3_nombre TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_3_password TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_4_nombre TEXT;
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS recepcionista_4_password TEXT;

-- 2. Agregar campo access_token para acceso genérico
ALTER TABLE public.gimnasios ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- 3. Crear tabla para tracking de movimientos de recepción
CREATE TABLE IF NOT EXISTS public.movimientos_recepcion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  recepcionista TEXT NOT NULL,
  accion TEXT NOT NULL, -- 'renovacion_plan', 'registro_asistencia', 'consulta_cliente'
  detalles TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para movimientos_recepcion
ALTER TABLE public.movimientos_recepcion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym owners can view their reception movements" ON public.movimientos_recepcion
  FOR SELECT USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Reception movements can be inserted" ON public.movimientos_recepcion
  FOR INSERT WITH CHECK (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_movimientos_recepcion_gimnasio ON public.movimientos_recepcion(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_recepcion_cliente ON public.movimientos_recepcion(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_recepcion_fecha ON public.movimientos_recepcion(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_recepcion_recepcionista ON public.movimientos_recepcion(recepcionista);

-- Index para access_token
CREATE INDEX IF NOT EXISTS idx_gimnasios_access_token ON public.gimnasios(access_token);

-- Comentarios para documentación
COMMENT ON COLUMN public.gimnasios.access_token IS 'Token único para acceso genérico de recepción sin autenticación';
COMMENT ON COLUMN public.gimnasios.recepcionista_1_nombre IS 'Nombre del primer recepcionista autorizado';
COMMENT ON COLUMN public.gimnasios.recepcionista_1_password IS 'Código de autorización del primer recepcionista';

COMMENT ON TABLE public.movimientos_recepcion IS 'Registro de todas las acciones realizadas por recepcionistas';
COMMENT ON COLUMN public.movimientos_recepcion.accion IS 'Tipo de acción: renovacion_plan, registro_asistencia, consulta_cliente';
COMMENT ON COLUMN public.movimientos_recepcion.recepcionista IS 'Nombre del recepcionista que realizó la acción';
COMMENT ON COLUMN public.movimientos_recepcion.detalles IS 'Información adicional sobre la acción realizada';