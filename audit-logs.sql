-- Tabla para logs de auditoría de membresías
-- Ejecutar en Supabase SQL Editor

CREATE TABLE public.logs_membresia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  inscripcion_id UUID REFERENCES public.inscripciones(id) ON DELETE SET NULL,
  gimnasio_id UUID NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de acción realizada
  accion VARCHAR(50) NOT NULL, -- 'crear_plan', 'modificar_fechas', 'renovar_plan', 'cancelar_plan'
  
  -- Descripción detallada del cambio
  descripcion TEXT NOT NULL,
  
  -- Datos anteriores (JSON para flexibilidad)
  datos_anteriores JSONB,
  
  -- Datos nuevos (JSON para flexibilidad) 
  datos_nuevos JSONB,
  
  -- Metadatos adicionales
  metadatos JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para consultas eficientes
CREATE INDEX idx_logs_membresia_cliente_id ON public.logs_membresia(cliente_id);
CREATE INDEX idx_logs_membresia_gimnasio_id ON public.logs_membresia(gimnasio_id);
CREATE INDEX idx_logs_membresia_created_at ON public.logs_membresia(created_at DESC);
CREATE INDEX idx_logs_membresia_accion ON public.logs_membresia(accion);

-- RLS (Row Level Security)
ALTER TABLE public.logs_membresia ENABLE ROW LEVEL SECURITY;

-- Política para que cada gimnasio solo vea sus propios logs
CREATE POLICY "Gimnasios pueden ver solo sus logs" ON public.logs_membresia
  FOR ALL USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios 
      WHERE usuario_id = auth.uid()
    )
  );

-- Política para insertar logs
CREATE POLICY "Usuarios pueden crear logs de sus gimnasios" ON public.logs_membresia
  FOR INSERT WITH CHECK (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios 
      WHERE usuario_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_logs_membresia_updated_at 
  BEFORE UPDATE ON public.logs_membresia 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permisos
GRANT ALL ON public.logs_membresia TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;