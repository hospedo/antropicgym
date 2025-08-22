import { Database } from './supabase'

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']

export type Gimnasio = Database['public']['Tables']['gimnasios']['Row']
export type GimnasioInsert = Database['public']['Tables']['gimnasios']['Insert']
export type GimnasioUpdate = Database['public']['Tables']['gimnasios']['Update']

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type Plan = Database['public']['Tables']['planes']['Row']
export type PlanInsert = Database['public']['Tables']['planes']['Insert']
export type PlanUpdate = Database['public']['Tables']['planes']['Update']

export type Inscripcion = Database['public']['Tables']['inscripciones']['Row']
export type InscripcionInsert = Database['public']['Tables']['inscripciones']['Insert']
export type InscripcionUpdate = Database['public']['Tables']['inscripciones']['Update']

export type Asistencia = Database['public']['Tables']['asistencias']['Row']
export type AsistenciaInsert = Database['public']['Tables']['asistencias']['Insert']
export type AsistenciaUpdate = Database['public']['Tables']['asistencias']['Update']

export type Pago = Database['public']['Tables']['pagos']['Row']
export type PagoInsert = Database['public']['Tables']['pagos']['Insert']
export type PagoUpdate = Database['public']['Tables']['pagos']['Update']

export type EstadoInscripcion = 'activa' | 'vencida' | 'cancelada'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'

// Tipos para el sistema de logs de auditoría
export type AccionMembresia = 'crear_plan' | 'modificar_fechas' | 'renovar_plan' | 'cancelar_plan'

export interface LogMembresia {
  id: string
  cliente_id: string
  inscripcion_id?: string | null
  gimnasio_id: string
  usuario_id: string
  accion: AccionMembresia
  descripcion: string
  datos_anteriores?: any
  datos_nuevos?: any
  metadatos?: any
  created_at: string
  updated_at: string
}

export interface LogMembresiaInsert {
  cliente_id: string
  inscripcion_id?: string | null
  gimnasio_id: string
  usuario_id: string
  accion: AccionMembresia
  descripcion: string
  datos_anteriores?: any
  datos_nuevos?: any
  metadatos?: any
}

// Extended types with relationships
export interface ClienteConInscripciones extends Cliente {
  inscripciones?: Inscripcion[]
  asistencias?: Asistencia[]
  pagos?: Pago[]
}

export interface InscripcionConDetalles extends Inscripcion {
  cliente?: Cliente
  plan?: Plan
  pagos?: Pago[]
}

export interface PlanConClientes extends Plan {
  inscripciones?: Inscripcion[]
}

// Tipos para reportes de bugs
export interface BugReport {
  id: string
  usuario_id: string
  gimnasio_id?: string | null
  tipo: 'bug' | 'recomendacion' | 'mejora'
  titulo: string
  descripcion: string
  pagina_url?: string | null
  navegador?: string | null
  estado: 'pendiente' | 'en_revision' | 'solucionado' | 'descartado'
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  created_at: string
  updated_at: string
}

export interface BugReportInsert {
  usuario_id: string
  gimnasio_id?: string | null
  tipo: 'bug' | 'recomendacion' | 'mejora'
  titulo: string
  descripcion: string
  pagina_url?: string | null
  navegador?: string | null
  estado?: 'pendiente' | 'en_revision' | 'solucionado' | 'descartado'
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
}

// Tipos para suscripciones
export interface Subscription {
  id: string
  usuario_id: string
  gimnasio_id?: string | null
  trial_start_date: string
  trial_end_date: string
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended'
  plan_type: 'monthly' | 'yearly'
  price_per_user: number
  max_users: number
  current_users_count: number
  last_billing_date?: string | null
  next_billing_date?: string | null
  payment_method?: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionInsert {
  usuario_id: string
  gimnasio_id?: string | null
  trial_start_date?: string
  trial_end_date?: string
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  status?: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended'
  plan_type?: 'monthly' | 'yearly'
  price_per_user?: number
  max_users?: number
  current_users_count?: number
  last_billing_date?: string | null
  next_billing_date?: string | null
  payment_method?: string | null
}