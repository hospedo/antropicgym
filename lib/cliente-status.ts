import { supabase } from './supabase'

// Actualizar estado de clientes según vigencia de planes
export async function actualizarEstadosClientes(gimnasioId: string) {
  try {
    const hoy = new Date().toISOString().split('T')[0]
    
    // Obtener todos los clientes del gimnasio con sus inscripciones
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select(`
        id,
        nombre,
        apellido,
        documento,
        activo,
        inscripciones (
          id,
          estado,
          fecha_fin,
          fecha_inicio
        )
      `)
      .eq('gimnasio_id', gimnasioId)

    if (error) {
      console.error('Error obteniendo clientes:', error)
      return { success: false, error }
    }

    const actualizaciones = []

    for (const cliente of clientes || []) {
      // Verificar si tiene al menos una inscripción activa
      const inscripcionActiva = cliente.inscripciones.find(
        inscripcion => 
          inscripcion.estado === 'activa' && 
          inscripcion.fecha_fin >= hoy
      )

      // Verificar si tiene inscripciones vencidas que deberían marcarse como vencidas
      const inscripcionesVencidas = cliente.inscripciones.filter(
        inscripcion => 
          inscripcion.estado === 'activa' && 
          inscripcion.fecha_fin < hoy
      )

      // Actualizar inscripciones vencidas
      for (const inscripcion of inscripcionesVencidas) {
        await supabase
          .from('inscripciones')
          .update({ estado: 'vencida' })
          .eq('id', inscripcion.id)
      }

      // Determinar el nuevo estado del cliente
      const nuevoEstado = !!inscripcionActiva
      
      // Si el estado cambió, actualizarlo
      if (cliente.activo !== nuevoEstado) {
        const { error: updateError } = await supabase
          .from('clientes')
          .update({ activo: nuevoEstado })
          .eq('id', cliente.id)

        if (updateError) {
          console.error(`Error actualizando cliente ${cliente.nombre}:`, updateError)
        } else {
          actualizaciones.push({
            cliente: `${cliente.nombre} ${cliente.apellido}`,
            documento: cliente.documento,
            estadoAnterior: cliente.activo,
            estadoNuevo: nuevoEstado,
            razon: inscripcionActiva ? 'Tiene plan vigente' : 'Plan vencido'
          })
        }
      }
    }

    return { 
      success: true, 
      actualizaciones,
      clientesRevisados: clientes?.length || 0
    }

  } catch (error) {
    console.error('Error en actualizarEstadosClientes:', error)
    return { success: false, error }
  }
}

// Obtener clientes con problemas de membresía (para AI Coach)
export async function getClientesConProblemas(gimnasioId: string) {
  try {
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select(`
        id,
        nombre,
        apellido,
        documento,
        usuario_id,
        activo,
        inscripciones (
          id,
          estado,
          fecha_fin,
          fecha_inicio,
          planes (
            nombre,
            precio
          )
        ),
        gimnasios (
          nombre
        )
      `)
      .eq('gimnasio_id', gimnasioId)
      .eq('activo', true) // Solo clientes activos
      .not('usuario_id', 'is', null) // Solo clientes con cuenta

    if (error) {
      throw error
    }

    const problemasDetectados = []

    for (const cliente of clientes || []) {
      // Verificar si tiene plan vencido
      const planVencido = cliente.inscripciones.find(
        inscripcion => 
          inscripcion.estado === 'vencida' || 
          (inscripcion.estado === 'activa' && inscripcion.fecha_fin < hoy)
      )

      // Verificar última asistencia para detectar ausencias
      const { data: ultimaAsistencia } = await supabase
        .from('asistencias')
        .select('fecha')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      let diasSinVenir = 0
      if (ultimaAsistencia) {
        const fechaUltimaAsistencia = new Date(ultimaAsistencia.fecha)
        const hoyDate = new Date()
        diasSinVenir = Math.floor((hoyDate.getTime() - fechaUltimaAsistencia.getTime()) / (1000 * 60 * 60 * 24))
      } else {
        diasSinVenir = 30 // Nunca ha venido
      }

      // Determinar tipo de problema
      let tipoProblema = null
      let prioridad = 'baja'

      if (planVencido && diasSinVenir >= 2) {
        tipoProblema = 'plan_vencido_y_ausente'
        prioridad = 'alta'
      } else if (planVencido) {
        tipoProblema = 'plan_vencido'
        prioridad = 'alta'
      } else if (diasSinVenir >= 7) {
        tipoProblema = 'ausencia_larga'
        prioridad = 'media'
      } else if (diasSinVenir >= 2) {
        tipoProblema = 'ausencia_corta'
        prioridad = 'baja'
      }

      if (tipoProblema) {
        problemasDetectados.push({
          ...cliente,
          dias_sin_venir: diasSinVenir,
          ultima_asistencia: ultimaAsistencia?.fecha || null,
          tipo_problema: tipoProblema,
          prioridad,
          plan_vencido: planVencido,
          inscripcion_activa: cliente.inscripciones.find(i => 
            i.estado === 'activa' && i.fecha_fin >= hoy
          )
        })
      }
    }

    return { success: true, data: problemasDetectados }

  } catch (error) {
    console.error('Error en getClientesConProblemas:', error)
    return { success: false, error }
  }
}

// Función para ejecutar mantenimiento automático
export async function ejecutarMantenimientoClientes(gimnasioId: string) {
  console.log(`Ejecutando mantenimiento para gimnasio ${gimnasioId}`)
  
  // 1. Actualizar estados de clientes
  const resultadoActualizacion = await actualizarEstadosClientes(gimnasioId)
  
  // 2. Obtener clientes con problemas
  const resultadoProblemas = await getClientesConProblemas(gimnasioId)
  
  return {
    actualizaciones: resultadoActualizacion,
    problemas: resultadoProblemas
  }
}