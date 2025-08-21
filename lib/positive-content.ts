import { supabase } from './supabase'
import { getBuenosAiresDateString, getBuenosAiresDate } from './timezone-utils'

// Tipos para contenido positivo
export interface ClienteDestacado {
  id: string
  nombre: string
  apellido: string
  tipo_logro: 'constancia' | 'racha' | 'regreso' | 'nuevo' | 'meta'
  dias_consecutivos?: number
  total_asistencias?: number
  ultima_asistencia: string
  gimnasio: {
    nombre: string
  }
  datos_extra?: {
    dias_sin_fallar?: number
    asistencias_mes?: number
    mejora_personal?: string
  }
}

// Detectar clientes que merecen reconocimiento
export async function detectarClientesDestacados(gimnasioId: string): Promise<ClienteDestacado[]> {
  const hoy = getBuenosAiresDateString()
  const hace7Dias = getBuenosAiresDate()
  hace7Dias.setDate(hace7Dias.getDate() - 7)
  const hace30Dias = getBuenosAiresDate()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  // Obtener clientes activos con cuentas
  const { data: clientesActivos } = await supabase
    .from('clientes')
    .select(`
      id,
      nombre,
      apellido,
      usuario_id,
      created_at,
      gimnasios (
        nombre
      )
    `)
    .eq('gimnasio_id', gimnasioId)
    .eq('activo', true)
    // .not('usuario_id', 'is', null) // Comentado: ahora incluye todos

  if (!clientesActivos) return []

  const clientesDestacados: ClienteDestacado[] = []

  for (const cliente of clientesActivos) {
    // Obtener asistencias del último mes
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('fecha')
      .eq('cliente_id', cliente.id)
      .gte('fecha', hace30Dias.toISOString().split('T')[0])
      .order('fecha', { ascending: true })

    if (!asistencias || asistencias.length === 0) continue

    const ultimaAsistencia = asistencias[asistencias.length - 1].fecha
    const asistenciasUltimaSemana = asistencias.filter(a => a.fecha >= hace7Dias.toISOString().split('T')[0])
    const totalAsistenciasMes = asistencias.length

    // Verificar si asistió hoy
    const asistiHoy = asistencias.some(a => a.fecha === hoy)

    // Calcular días consecutivos
    const diasConsecutivos = calcularDiasConsecutivos(asistencias, hoy)

    // Detectar tipos de logros
    let tipoLogro: ClienteDestacado['tipo_logro'] | null = null
    let datosExtra: any = {}

    // 1. CONSTANCIA: 5+ días consecutivos
    if (diasConsecutivos >= 5) {
      tipoLogro = 'constancia'
      datosExtra.dias_sin_fallar = diasConsecutivos
    }
    // 2. RACHA: Asistió 5+ veces en la última semana
    else if (asistenciasUltimaSemana.length >= 5) {
      tipoLogro = 'racha'
      datosExtra.asistencias_semana = asistenciasUltimaSemana.length
    }
    // 3. REGRESO: No venía hace mucho y ahora tiene buena frecuencia
    else if (totalAsistenciasMes >= 8 && diasConsecutivos >= 3) {
      tipoLogro = 'regreso'
      datosExtra.asistencias_mes = totalAsistenciasMes
    }
    // 4. NUEVO: Cliente nuevo (menos de 30 días) con buena asistencia
    else if (esClienteNuevo(cliente.created_at) && totalAsistenciasMes >= 6) {
      tipoLogro = 'nuevo'
      datosExtra.asistencias_desde_inicio = totalAsistenciasMes
    }
    // 5. META: Asistió hoy y es un hito (10, 25, 50, 100 asistencias totales)
    else if (asistiHoy && esHitoAsistencias(await getTotalAsistenciasCliente(cliente.id))) {
      tipoLogro = 'meta'
      datosExtra.total_asistencias = await getTotalAsistenciasCliente(cliente.id)
    }

    if (tipoLogro) {
      clientesDestacados.push({
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        tipo_logro: tipoLogro,
        dias_consecutivos: diasConsecutivos,
        total_asistencias: totalAsistenciasMes,
        ultima_asistencia: ultimaAsistencia,
        gimnasio: cliente.gimnasios?.[0] || { nombre: 'Sin gimnasio' },
        datos_extra: datosExtra
      })
    }
  }

  return clientesDestacados
}

// Calcular días consecutivos de asistencia
function calcularDiasConsecutivos(asistencias: Array<{fecha: string}>, fechaHoy: string): number {
  if (asistencias.length === 0) return 0

  const fechasUnicas = Array.from(new Set(asistencias.map(a => a.fecha))).sort()
  let diasConsecutivos = 0
  let fechaActual = new Date(fechaHoy)

  // Empezar desde hoy hacia atrás
  for (let i = 0; i <= 30; i++) { // Máximo 30 días hacia atrás
    const fechaStr = fechaActual.toISOString().split('T')[0]
    
    if (fechasUnicas.includes(fechaStr)) {
      diasConsecutivos++
    } else if (diasConsecutivos > 0) {
      // Si ya había racha y hoy no vino, terminar
      break
    }
    
    fechaActual.setDate(fechaActual.getDate() - 1)
  }

  return diasConsecutivos
}

// Verificar si es cliente nuevo (menos de 30 días)
function esClienteNuevo(fechaCreacion: string): boolean {
  const hace30Dias = getBuenosAiresDate()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  return new Date(fechaCreacion) > hace30Dias
}

// Verificar si el total de asistencias es un hito
function esHitoAsistencias(total: number): boolean {
  const hitos = [10, 25, 50, 100, 200, 365, 500, 1000]
  return hitos.includes(total)
}

// Obtener total de asistencias de un cliente
async function getTotalAsistenciasCliente(clienteId: string): Promise<number> {
  const { count } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', clienteId)
  
  return count || 0
}

// Generar contenido positivo viral
export function generarContenidoPositivo(cliente: ClienteDestacado) {
  const contenidosPorTipo = {
    constancia: {
      titulos: [
        `🔥 ${cliente.nombre} lleva ${cliente.datos_extra?.dias_sin_fallar} días consecutivos sin fallar`,
        `💪 MÁQUINA IMPARABLE: ${cliente.nombre} - ${cliente.datos_extra?.dias_sin_fallar} días seguidos`,
        `🏆 ${cliente.nombre} está en MODO BESTIA: ${cliente.datos_extra?.dias_sin_fallar} días sin parar`
      ],
      descripciones: [
        `¡${cliente.nombre} está en llamas! 🔥 Lleva ${cliente.datos_extra?.dias_sin_fallar} días consecutivos entrenando. ¡ESO es CONSTANCIA!`,
        `👑 APLAUSOS para ${cliente.nombre} que lleva ${cliente.datos_extra?.dias_sin_fallar} días sin fallar. ¡Así se hace!`,
        `🚀 ${cliente.nombre} está demostrando que la DISCIPLINA supera a la motivación. ${cliente.datos_extra?.dias_sin_fallar} días consecutivos de puro poder`
      ],
      hashtags: ['#Constancia', '#Disciplina', '#Imparable', '#FitnessGoals', '#Motivacion']
    },
    racha: {
      titulos: [
        `⚡ ${cliente.nombre} está EN RACHA: ${cliente.datos_extra?.asistencias_semana} veces esta semana`,
        `🎯 ENFOQUE TOTAL: ${cliente.nombre} vino ${cliente.datos_extra?.asistencias_semana} veces en 7 días`,
        `💥 ${cliente.nombre} está que no para: ${cliente.datos_extra?.asistencias_semana}/7 días esta semana`
      ],
      descripciones: [
        `¡${cliente.nombre} está IMPARABLE! ⚡ ${cliente.datos_extra?.asistencias_semana} entrenamientos esta semana. ¡Esa es la actitud que queremos ver!`,
        `👏 OVACIÓN para ${cliente.nombre}: ${cliente.datos_extra?.asistencias_semana} días de entrenamiento esta semana. ¡ASÍ SE HACE!`,
        `🔥 ${cliente.nombre} entendió la tarea: ${cliente.datos_extra?.asistencias_semana} entrenamientos en una semana. ¡BRUTAL!`
      ],
      hashtags: ['#EnRacha', '#Frecuencia', '#Dedicacion', '#GymLife', '#NoExcuses']
    },
    regreso: {
      titulos: [
        `🎉 ¡REGRESÓ CON TODO! ${cliente.nombre} está de vuelta y mejor que nunca`,
        `💪 COMEBACK ÉPICO: ${cliente.nombre} volvió con ${cliente.datos_extra?.asistencias_mes} entrenamientos este mes`,
        `🚀 ${cliente.nombre} demostró que nunca es tarde para volver más fuerte`
      ],
      descripciones: [
        `¡Welcome back, ${cliente.nombre}! 🎉 ${cliente.datos_extra?.asistencias_mes} entrenamientos este mes prueban que NUNCA se rindió`,
        `👑 ${cliente.nombre} nos recuerda que los COMEBACKS son reales. ${cliente.datos_extra?.asistencias_mes} sesiones y contando`,
        `💥 Plot twist: ${cliente.nombre} regresó más motivado que nunca. ${cliente.datos_extra?.asistencias_mes} entrenamientos hablan por sí solos`
      ],
      hashtags: ['#Comeback', '#NuncaEsTarde', '#Regreso', '#Motivacion', '#Transformation']
    },
    nuevo: {
      titulos: [
        `🌟 NUEVO GUERRERO: ${cliente.nombre} lleva ${cliente.datos_extra?.asistencias_desde_inicio} entrenamientos desde que empezó`,
        `💪 TALENTO NUEVO: ${cliente.nombre} está dominando el gym con ${cliente.datos_extra?.asistencias_desde_inicio} sesiones`,
        `🚀 ${cliente.nombre} llegó para quedarse: ${cliente.datos_extra?.asistencias_desde_inicio} entrenamientos y subiendo`
      ],
      descripciones: [
        `¡Tenemos talento nuevo! 🌟 ${cliente.nombre} lleva ${cliente.datos_extra?.asistencias_desde_inicio} entrenamientos desde que empezó. ¡Así se comienza!`,
        `👏 BIENVENIDO al club de los constantes, ${cliente.nombre}. ${cliente.datos_extra?.asistencias_desde_inicio} sesiones y ya está dando cátedra`,
        `💥 ${cliente.nombre} entendió rápido de qué se trata esto: ${cliente.datos_extra?.asistencias_desde_inicio} entrenamientos en sus primeras semanas`
      ],
      hashtags: ['#NuevoTalento', '#Bienvenido', '#Constancia', '#FreshStart', '#GymFamily']
    },
    meta: {
      titulos: [
        `🏆 HITO ÉPICO: ${cliente.nombre} alcanzó ${cliente.datos_extra?.total_asistencias} entrenamientos totales`,
        `💥 LEYENDA EN CONSTRUCCIÓN: ${cliente.nombre} - ${cliente.datos_extra?.total_asistencias} entrenamientos completados`,
        `👑 HALL OF FAME: ${cliente.nombre} llegó a ${cliente.datos_extra?.total_asistencias} sesiones de entrenamiento`
      ],
      descripciones: [
        `🎉 ¡HISTÓRICO! ${cliente.nombre} acaba de completar su entrenamiento número ${cliente.datos_extra?.total_asistencias}. ¡ESO es DEDICACIÓN!`,
        `👏 MOMENTO ÉPICO: ${cliente.nombre} alcanzó ${cliente.datos_extra?.total_asistencias} entrenamientos. ¡Cada sesión cuenta!`,
        `🏆 ${cliente.nombre} acaba de escribir historia: ${cliente.datos_extra?.total_asistencias} entrenamientos oficiales. ¡LEYENDA!`
      ],
      hashtags: ['#Hito', '#Leyenda', '#Dedicacion', '#Goals', '#Historia']
    }
  }

  const contenido = contenidosPorTipo[cliente.tipo_logro]
  const tituloIndex = Math.floor(Math.random() * contenido.titulos.length)
  
  return {
    tipo: 'celebracion' as const,
    titulo: contenido.titulos[tituloIndex],
    descripcion: contenido.descripciones[tituloIndex],
    personalidad: 'Coach Motivador',
    cliente_nombre: `${cliente.nombre} ${cliente.apellido}`,
    tipo_logro: cliente.tipo_logro,
    hashtags: ['#AICoach', '#GymMotivation', '#Success', ...contenido.hashtags],
    prompt_imagen: `${cliente.nombre} celebrando en el gimnasio, confetti dorado, ambiente victorioso, estilo inspiracional, colores vibrantes, ${contenido.titulos[tituloIndex]}`
  }
}

// Función principal para ejecutar detección de contenido positivo
export async function ejecutarDeteccionPositiva(gimnasioId: string) {
  try {
    const clientesDestacados = await detectarClientesDestacados(gimnasioId)
    
    if (clientesDestacados.length === 0) {
      return { success: true, contenido: [], mensaje: 'No hay logros destacados hoy' }
    }

    const contenidoGenerado = clientesDestacados.map(cliente => 
      generarContenidoPositivo(cliente)
    )

    // Guardar en base de datos
    for (let i = 0; i < clientesDestacados.length; i++) {
      const cliente = clientesDestacados[i]
      const contenido = contenidoGenerado[i]
      
      // Verificar si ya se generó contenido positivo hoy para este cliente
      const hoy = getBuenosAiresDateString()
      
      const { data: yaGenerado } = await supabase
        .from('ai_content_generated')
        .select('id')
        .eq('cliente_id', cliente.id)
        .eq('fecha_generacion', hoy)
        .eq('tipo_contenido', 'celebracion')
        .single()

      if (!yaGenerado) {
        await supabase
          .from('ai_content_generated')
          .insert({
            cliente_id: cliente.id,
            fecha_generacion: hoy,
            tipo_contenido: 'celebracion',
            personalidad: 'Coach Motivador',
            contenido_data: contenido
          })
      }
    }

    return { success: true, contenido: contenidoGenerado, clientes: clientesDestacados }
    
  } catch (error) {
    console.error('Error en detección positiva:', error)
    return { success: false, error }
  }
}