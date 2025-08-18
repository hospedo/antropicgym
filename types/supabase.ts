export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string
          telefono: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gimnasios: {
        Row: {
          id: string
          usuario_id: string
          nombre: string
          direccion: string | null
          telefono: string | null
          email: string | null
          logo_url: string | null
          horario_apertura: string | null
          horario_cierre: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nombre: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          logo_url?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nombre?: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          logo_url?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          gimnasio_id: string
          nombre: string
          apellido: string
          email: string | null
          telefono: string | null
          fecha_nacimiento: string | null
          direccion: string | null
          documento: string | null
          observaciones: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gimnasio_id: string
          nombre: string
          apellido: string
          email?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          direccion?: string | null
          documento?: string | null
          observaciones?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gimnasio_id?: string
          nombre?: string
          apellido?: string
          email?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          direccion?: string | null
          documento?: string | null
          observaciones?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      planes: {
        Row: {
          id: string
          gimnasio_id: string
          nombre: string
          descripcion: string | null
          precio: number
          duracion_dias: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gimnasio_id: string
          nombre: string
          descripcion?: string | null
          precio: number
          duracion_dias: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gimnasio_id?: string
          nombre?: string
          descripcion?: string | null
          precio?: number
          duracion_dias?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inscripciones: {
        Row: {
          id: string
          cliente_id: string
          plan_id: string
          fecha_inicio: string
          fecha_fin: string
          estado: 'activa' | 'vencida' | 'cancelada'
          monto_pagado: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          plan_id: string
          fecha_inicio: string
          fecha_fin: string
          estado?: 'activa' | 'vencida' | 'cancelada'
          monto_pagado?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          plan_id?: string
          fecha_inicio?: string
          fecha_fin?: string
          estado?: 'activa' | 'vencida' | 'cancelada'
          monto_pagado?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      asistencias: {
        Row: {
          id: string
          cliente_id: string
          fecha: string
          hora: string
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          fecha?: string
          hora?: string
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          fecha?: string
          hora?: string
          created_at?: string
        }
      }
      pagos: {
        Row: {
          id: string
          inscripcion_id: string
          cliente_id: string
          monto: number
          metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
          fecha_pago: string
          observaciones: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inscripcion_id: string
          cliente_id: string
          monto: number
          metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
          fecha_pago?: string
          observaciones?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          inscripcion_id?: string
          cliente_id?: string
          monto?: number
          metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
          fecha_pago?: string
          observaciones?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}