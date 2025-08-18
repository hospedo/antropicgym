-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gimnasios table
CREATE TABLE public.gimnasios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  logo_url TEXT,
  horario_apertura TIME,
  horario_cierre TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  documento TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create planes table
CREATE TABLE public.planes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gimnasio_id UUID REFERENCES public.gimnasios(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  duracion_dias INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inscripciones table
CREATE TABLE public.inscripciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.planes(id) ON DELETE CASCADE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado TEXT CHECK (estado IN ('activa', 'vencida', 'cancelada')) DEFAULT 'activa',
  monto_pagado DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asistencias table
CREATE TABLE public.asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pagos table
CREATE TABLE public.pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inscripcion_id UUID REFERENCES public.inscripciones(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')) NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view own profile" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for gimnasios
CREATE POLICY "Users can view own gym" ON public.gimnasios
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own gym" ON public.gimnasios
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own gym" ON public.gimnasios
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own gym" ON public.gimnasios
  FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies for clientes
CREATE POLICY "Users can view clients of their gym" ON public.clientes
  FOR SELECT USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients to their gym" ON public.clientes
  FOR INSERT WITH CHECK (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients of their gym" ON public.clientes
  FOR UPDATE USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients of their gym" ON public.clientes
  FOR DELETE USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

-- RLS Policies for planes
CREATE POLICY "Users can view plans of their gym" ON public.planes
  FOR SELECT USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert plans to their gym" ON public.planes
  FOR INSERT WITH CHECK (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plans of their gym" ON public.planes
  FOR UPDATE USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plans of their gym" ON public.planes
  FOR DELETE USING (
    gimnasio_id IN (
      SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
    )
  );

-- RLS Policies for inscripciones
CREATE POLICY "Users can view inscriptions of their gym clients" ON public.inscripciones
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert inscriptions for their gym clients" ON public.inscripciones
  FOR INSERT WITH CHECK (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update inscriptions of their gym clients" ON public.inscripciones
  FOR UPDATE USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete inscriptions of their gym clients" ON public.inscripciones
  FOR DELETE USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

-- RLS Policies for asistencias
CREATE POLICY "Users can view attendance of their gym clients" ON public.asistencias
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert attendance for their gym clients" ON public.asistencias
  FOR INSERT WITH CHECK (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete attendance of their gym clients" ON public.asistencias
  FOR DELETE USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

-- RLS Policies for pagos
CREATE POLICY "Users can view payments of their gym clients" ON public.pagos
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert payments for their gym clients" ON public.pagos
  FOR INSERT WITH CHECK (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update payments of their gym clients" ON public.pagos
  FOR UPDATE USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete payments of their gym clients" ON public.pagos
  FOR DELETE USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE gimnasio_id IN (
        SELECT id FROM public.gimnasios WHERE usuario_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_gimnasios_usuario_id ON public.gimnasios(usuario_id);
CREATE INDEX idx_clientes_gimnasio_id ON public.clientes(gimnasio_id);
CREATE INDEX idx_planes_gimnasio_id ON public.planes(gimnasio_id);
CREATE INDEX idx_inscripciones_cliente_id ON public.inscripciones(cliente_id);
CREATE INDEX idx_inscripciones_plan_id ON public.inscripciones(plan_id);
CREATE INDEX idx_asistencias_cliente_id ON public.asistencias(cliente_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_pagos_inscripcion_id ON public.pagos(inscripcion_id);
CREATE INDEX idx_pagos_cliente_id ON public.pagos(cliente_id);

-- Create function to handle updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gimnasios_updated_at BEFORE UPDATE ON public.gimnasios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planes_updated_at BEFORE UPDATE ON public.planes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscripciones_updated_at BEFORE UPDATE ON public.inscripciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
