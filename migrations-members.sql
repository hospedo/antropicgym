-- Migración minimalista para funcionalidad de miembros
-- Solo agrega lo mínimo necesario sin romper estructura existente

-- 1. Agregar campo usuario_id a tabla clientes existente
ALTER TABLE public.clientes ADD COLUMN usuario_id UUID REFERENCES auth.users(id) NULL;

-- Index para performance
CREATE INDEX idx_clientes_usuario_id ON public.clientes(usuario_id);

-- 2. Crear tabla minimalista para invitaciones
CREATE TABLE public.invitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  usado BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para invitaciones
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym owners can manage invitations" ON public.invitaciones
  FOR ALL USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

-- Indexes para performance
CREATE INDEX idx_invitaciones_codigo ON public.invitaciones(codigo);
CREATE INDEX idx_invitaciones_gimnasio_id ON public.invitaciones(gimnasio_id);

-- 3. RLS policies adicionales para miembros
-- Permitir a clientes ver sus propios datos cuando tienen cuenta
CREATE POLICY "Members can view own profile" ON public.clientes
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Members can update own profile" ON public.clientes
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Permitir a miembros ver sus inscripciones
CREATE POLICY "Members can view own inscriptions" ON public.inscripciones
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE usuario_id = auth.uid()
    )
  );

-- Permitir a miembros ver sus asistencias
CREATE POLICY "Members can view own attendance" ON public.asistencias
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE usuario_id = auth.uid()
    )
  );

-- Permitir a miembros ver sus pagos
CREATE POLICY "Members can view own payments" ON public.pagos
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE usuario_id = auth.uid()
    )
  );

-- 4. Tabla para tracking de contenido AI generado
CREATE TABLE public.ai_content_generated (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  fecha_generacion DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_contenido TEXT CHECK (tipo_contenido IN ('meme', 'video', 'story')) NOT NULL,
  personalidad TEXT NOT NULL,
  contenido_data JSONB,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para ai_content_generated
ALTER TABLE public.ai_content_generated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym owners can view AI content of their clients" ON public.ai_content_generated
  FOR SELECT USING (
    cliente_id IN (
      SELECT c.id FROM public.clientes c
      JOIN public.gimnasios g ON c.gimnasio_id = g.id
      WHERE g.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can manage AI content of their clients" ON public.ai_content_generated
  FOR ALL USING (
    cliente_id IN (
      SELECT c.id FROM public.clientes c
      JOIN public.gimnasios g ON c.gimnasio_id = g.id
      WHERE g.usuario_id = auth.uid()
    )
  );

-- Indexes para performance
CREATE INDEX idx_ai_content_cliente_id ON public.ai_content_generated(cliente_id);
CREATE INDEX idx_ai_content_fecha ON public.ai_content_generated(fecha_generacion);

-- 5. Agregar rol de usuario a la tabla usuarios
ALTER TABLE public.usuarios ADD COLUMN rol TEXT CHECK (rol IN ('admin', 'recepcionista')) DEFAULT 'admin';

-- 6. Tabla para vincular recepcionistas con gimnasios
CREATE TABLE public.usuarios_gimnasios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE NOT NULL,
  permisos JSONB DEFAULT '{"consultas": true, "asistencias": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, gimnasio_id)
);

-- RLS para usuarios_gimnasios
ALTER TABLE public.usuarios_gimnasios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gym associations" ON public.usuarios_gimnasios
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Admin users can manage gym associations" ON public.usuarios_gimnasios
  FOR ALL USING (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Index para performance
CREATE INDEX idx_usuarios_gimnasios_usuario ON public.usuarios_gimnasios(usuario_id);
CREATE INDEX idx_usuarios_gimnasios_gimnasio ON public.usuarios_gimnasios(gimnasio_id);