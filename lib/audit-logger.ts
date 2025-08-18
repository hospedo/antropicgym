import { supabase } from './supabase'
import { LogMembresiaInsert, AccionMembresia } from '@/types'
import { getBuenosAiresTimestamp } from './timezone-utils'

export class AuditLogger {
  /**
   * Registra un cambio en las membresías
   */
  static async registrarCambioMembresia({
    clienteId,
    inscripcionId,
    accion,
    descripcion,
    datosAnteriores,
    datosNuevos,
    metadatos = {}
  }: {
    clienteId: string
    inscripcionId?: string | null
    accion: AccionMembresia
    descripcion: string
    datosAnteriores?: any
    datosNuevos?: any
    metadatos?: any
  }) {
    try {
      // Obtener datos del usuario y gimnasio
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!gimnasio) throw new Error('Gimnasio no encontrado')

      // Crear el log
      const logData: LogMembresiaInsert = {
        cliente_id: clienteId,
        inscripcion_id: inscripcionId || null,
        gimnasio_id: gimnasio.id,
        usuario_id: user.id,
        accion,
        descripcion,
        datos_anteriores: datosAnteriores || null,
        datos_nuevos: datosNuevos || null,
        metadatos: {
          ...metadatos,
          timestamp: getBuenosAiresTimestamp(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
        }
      }

      const { error } = await supabase
        .from('logs_membresia')
        .insert(logData)

      if (error) {
        console.error('Error al registrar log de auditoría:', error)
        // No lanzamos error para no interrumpir el flujo principal
      }

    } catch (error) {
      console.error('Error en audit logger:', error)
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtiene los logs de un cliente específico
   */
  static async obtenerLogsCliente(clienteId: string) {
    try {
      const { data, error } = await supabase
        .from('logs_membresia')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener logs del cliente:', error)
      return []
    }
  }

  /**
   * Obtiene todos los logs del gimnasio con paginación
   */
  static async obtenerLogsGimnasio({
    limite = 50,
    offset = 0,
    filtroAccion
  }: {
    limite?: number
    offset?: number
    filtroAccion?: AccionMembresia
  } = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!gimnasio) throw new Error('Gimnasio no encontrado')

      let query = supabase
        .from('logs_membresia')
        .select(`
          *,
          cliente:clientes (
            nombre,
            apellido,
            documento
          )
        `)
        .eq('gimnasio_id', gimnasio.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limite - 1)

      if (filtroAccion) {
        query = query.eq('accion', filtroAccion)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener logs del gimnasio:', error)
      return []
    }
  }
}