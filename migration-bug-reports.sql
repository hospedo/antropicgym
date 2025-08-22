-- Crear tabla para reportes de bugs y recomendaciones
CREATE TABLE public.bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('bug', 'recomendacion', 'mejora')),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  pagina_url TEXT,
  navegador TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'solucionado', 'descartado')),
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios reportes
CREATE POLICY "Users can view own bug reports" ON public.bug_reports
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que los usuarios puedan crear reportes
CREATE POLICY "Users can create bug reports" ON public.bug_reports
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para que los usuarios puedan actualizar sus propios reportes
CREATE POLICY "Users can update own bug reports" ON public.bug_reports
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Índices para mejorar performance
CREATE INDEX idx_bug_reports_usuario_id ON public.bug_reports(usuario_id);
CREATE INDEX idx_bug_reports_gimnasio_id ON public.bug_reports(gimnasio_id);
CREATE INDEX idx_bug_reports_tipo ON public.bug_reports(tipo);
CREATE INDEX idx_bug_reports_estado ON public.bug_reports(estado);
CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at);