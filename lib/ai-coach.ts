import { supabase } from './supabase'
import { getBuenosAiresDateString, getBuenosAiresDate } from './timezone-utils'

// Tipos para el AI Coach
export interface ClienteAusencia {
  id: string
  nombre: string
  apellido: string
  dias_sin_venir: number
  ultima_asistencia: string | null
  gimnasio: {
    nombre: string
  }
  personalidad_preferida?: 'motivador' | 'sarcástico' | 'abuela' | 'científico'
  razon_problema?: string
  plan_vencido?: boolean
  plan_activo?: boolean
  cliente_activo?: boolean
  usuario_id?: string
}

export interface ContenidoViral {
  tipo: 'meme' | 'video' | 'story'
  titulo: string
  descripcion: string
  personalidad: string
  cliente_nombre: string
  dias_ausencia: number
  hashtags: string[]
  prompt_imagen: string
}

// Detector de ausencias mejorado
export async function detectarClientesAusentes(gimnasioId: string): Promise<ClienteAusencia[]> {
  // Primero ejecutar mantenimiento de estados
  const { ejecutarMantenimientoClientes } = await import('./cliente-status')
  await ejecutarMantenimientoClientes(gimnasioId)
  
  const hoy = getBuenosAiresDateString()
  
  // Buscar clientes con cuentas que tengan problemas
  const { data: clientesConCuenta } = await supabase
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
          nombre
        )
      ),
      gimnasios (
        nombre
      )
    `)
    .eq('gimnasio_id', gimnasioId)
    // Comentado: .not('usuario_id', 'is', null) // Ahora incluye TODOS los clientes

  if (!clientesConCuenta) return []

  const clientesProblematicos: ClienteAusencia[] = []

  for (const cliente of clientesConCuenta) {
    // Verificar si tiene plan vencido
    const planVencido = cliente.inscripciones.find(
      inscripcion => 
        inscripcion.estado === 'vencida' || 
        (inscripcion.estado === 'activa' && inscripcion.fecha_fin < hoy)
    )

    // Verificar plan activo
    const planActivo = cliente.inscripciones.find(
      inscripcion => 
        inscripcion.estado === 'activa' && 
        inscripcion.fecha_fin >= hoy
    )

    // Verificar última asistencia
    const { data: ultimaAsistencia } = await supabase
      .from('asistencias')
      .select('fecha, hora')
      .eq('cliente_id', cliente.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(1)
      .single()

    let diasSinVenir = 0
    let ultimaFecha = null

    if (ultimaAsistencia) {
      const fechaUltimaAsistencia = new Date(ultimaAsistencia.fecha)
      const hoyDate = getBuenosAiresDate()
      diasSinVenir = Math.floor((hoyDate.getTime() - fechaUltimaAsistencia.getTime()) / (1000 * 60 * 60 * 24))
      ultimaFecha = ultimaAsistencia.fecha
    } else {
      diasSinVenir = 30 // Nunca ha venido
    }

    // Incluir cliente si:
    // 1. Tiene plan vencido (prioridad alta)
    // 2. No ha venido en 2+ días Y tiene plan activo
    // 3. No está activo (estado inconsistente)
    
    let debeIncluir = false
    let razonProblema = ''

    if (planVencido && !planActivo) {
      debeIncluir = true
      razonProblema = 'plan_vencido'
    } else if (!cliente.activo) {
      debeIncluir = true
      razonProblema = 'cliente_inactivo'
    } else if (diasSinVenir >= 2 && planActivo) {
      debeIncluir = true
      razonProblema = 'ausencia'
    }

    if (debeIncluir) {
      clientesProblematicos.push({
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dias_sin_venir: diasSinVenir,
        ultima_asistencia: ultimaFecha,
        gimnasio: cliente.gimnasios,
        razon_problema: razonProblema,
        plan_vencido: !!planVencido,
        plan_activo: !!planActivo,
        cliente_activo: cliente.activo,
        usuario_id: cliente.usuario_id
      })
    }
  }

  return clientesProblematicos
}

// Personalidades del AI Coach
const personalidades = {
  motivador: {
    nombre: "Coach Motivador",
    tono: "inspiracional y energético",
    frases: [
      "¡Tu cuerpo te está esperando!",
      "Cada día que no vienes, tus músculos lloran",
      "¡Vamos campeón, el gym te extraña!"
    ]
  },
  sarcástico: {
    nombre: "Coach Sarcástico", 
    tono: "divertido y sarcástico",
    frases: [
      "Ah... ¿ya te olvidaste de mí?",
      "Las pesas se preguntan si sigues vivo",
      "Netflix no cuenta como cardio"
    ]
  },
  abuela: {
    nombre: "Abuela Fitness",
    tono: "cariñoso pero regañón",
    frases: [
      "Mijo, ¿dónde andas?",
      "Tu abuela fitness está preocupada",
      "¿Ya se te olvidó a tu abuelita del gym?"
    ]
  },
  científico: {
    nombre: "Dr. Datos",
    tono: "científico y analítico",
    frases: [
      "Mis datos indican que... ¡DESAPARECISTE!",
      "Análisis: 0% de asistencia detectado",
      "Error 404: Cliente no encontrado"
    ]
  }
}

// Generar contenido viral con IA
export async function generarContenidoViral(cliente: ClienteAusencia): Promise<ContenidoViral> {
  // Seleccionar personalidad según tipo de problema
  let personalidadKey: keyof typeof personalidades
  
  if (cliente.razon_problema === 'plan_vencido') {
    // Para planes vencidos, usar personalidades más directas
    personalidadKey = Math.random() > 0.5 ? 'científico' : 'abuela'
  } else if (cliente.razon_problema === 'cliente_inactivo') {
    personalidadKey = 'motivador'
  } else {
    // Para ausencias normales, personalidad aleatoria
    const personalidadesKeys = Object.keys(personalidades) as Array<keyof typeof personalidades>
    personalidadKey = personalidadesKeys[Math.floor(Math.random() * personalidadesKeys.length)]
  }
  
  const personalidad = personalidades[personalidadKey]

  // Determinar nivel de "drama" según tipo de problema y días
  let nivelDrama = 'suave'
  let intensidad = 'preocupado'
  
  if (cliente.razon_problema === 'plan_vencido') {
    nivelDrama = 'dramático'
    intensidad = 'urgente'
  } else if (cliente.dias_sin_venir >= 7) {
    nivelDrama = 'dramático'
    intensidad = 'desesperado'
  } else if (cliente.dias_sin_venir >= 4) {
    nivelDrama = 'medio'
    intensidad = 'insistente'
  }

  // Frases específicas según problema
  let frase = personalidad.frases[Math.floor(Math.random() * personalidad.frases.length)]
  
  if (cliente.razon_problema === 'plan_vencido') {
    const frasesVencimiento = [
      `${cliente.nombre}, tu membresía venció y te estamos extrañando`,
      `¡${cliente.nombre}! Tu plan expiró, ¿cuándo regresas?`,
      `${cliente.nombre}, sin membresía activa no puedes entrenar conmigo`
    ]
    frase = frasesVencimiento[Math.floor(Math.random() * frasesVencimiento.length)]
  }
  
  const contenido: ContenidoViral = {
    tipo: cliente.razon_problema === 'plan_vencido' ? 'video' : (Math.random() > 0.5 ? 'meme' : 'story'),
    titulo: `${personalidad.nombre} ${cliente.razon_problema === 'plan_vencido' ? 'necesita hablar con' : 'busca a'} ${cliente.nombre}`,
    descripcion: generarDescripcion(cliente, personalidad, frase, nivelDrama),
    personalidad: personalidad.nombre,
    cliente_nombre: `${cliente.nombre} ${cliente.apellido}`,
    dias_ausencia: cliente.dias_sin_venir,
    hashtags: generarHashtags(cliente, personalidadKey, nivelDrama),
    prompt_imagen: generarPromptImagen(cliente, personalidad, intensidad)
  }

  return contenido
}

function generarDescripcion(cliente: ClienteAusencia, personalidad: any, frase: string, nivelDrama: string): string {
  const templates = {
    suave: [
      `${personalidad.nombre} del ${cliente.gimnasio.nombre} pregunta por ${cliente.nombre}... 🤔`,
      `"${frase}" - dice ${personalidad.nombre} después de ${cliente.dias_sin_venir} días sin ver a ${cliente.nombre}`,
    ],
    medio: [
      `🚨 ALERTA: ${cliente.nombre} lleva ${cliente.dias_sin_venir} días desaparecido del ${cliente.gimnasio.nombre}`,
      `${personalidad.nombre} está ${cliente.dias_sin_venir} días buscando a ${cliente.nombre}... "${frase}"`,
    ],
    dramático: [
      `💔 DRAMA EN ${cliente.gimnasio.nombre}: ${cliente.nombre} lleva ${cliente.dias_sin_venir} días sin aparecer`,
      `${personalidad.nombre} después de ${cliente.dias_sin_venir} días: "${frase}" 😢`,
    ]
  }

  const template = templates[nivelDrama as keyof typeof templates]
  return template[Math.floor(Math.random() * template.length)]
}

function generarHashtags(cliente: ClienteAusencia, personalidad: string, nivelDrama: string): string[] {
  const hashtags = [
    '#GymAI',
    '#AICoach',
    '#FitnessMotivation',
    `#${cliente.gimnasio.nombre.replace(/\s+/g, '')}`,
    '#GymLife'
  ]

  // Hashtags específicos por personalidad
  const hashtagsPersonalidad = {
    motivador: ['#MotivationMode', '#NeverGiveUp'],
    sarcástico: ['#GymSarcasm', '#FitnessReality'],
    abuela: ['#AbuelaFitness', '#CariñoConRegaño'], 
    científico: ['#DataDriven', '#FitnessScience']
  }

  hashtags.push(...(hashtagsPersonalidad[personalidad as keyof typeof hashtagsPersonalidad] || []))

  // Hashtags por nivel de drama
  if (nivelDrama === 'dramático') {
    hashtags.push('#GymDrama', '#Missing')
  }

  return hashtags
}

function generarPromptImagen(cliente: ClienteAusencia, personalidad: any, intensidad: string): string {
  const estilosVisuales = {
    motivador: "superhéroe musculoso con pose inspiradora",
    sarcástico: "personaje con expresión sarcástica y brazos cruzados", 
    abuela: "abuela fitness con ropa deportiva y expresión preocupada",
    científico: "científico con bata blanca sosteniendo gráficos de datos"
  }

  const ambientes = {
    suave: "en un gimnasio luminoso y amigable",
    insistente: "en un gimnasio con luces intermitentes",
    desesperado: "en un gimnasio oscuro con spotlight dramático"
  }

  const personalidadKey = Object.keys(personalidades).find(key => 
    personalidades[key as keyof typeof personalidades].nombre === personalidad.nombre
  ) as keyof typeof estilosVisuales

  return `${estilosVisuales[personalidadKey]} ${ambientes[intensidad as keyof typeof ambientes]}, estilo cartoon colorido, expresión ${intensidad}, con texto flotante que dice "${personalidad.frases[0]}"`
}

// Programar chequeo automático de ausencias
export async function ejecutarChequeoAusencias(gimnasioId: string) {
  try {
    const clientesAusentes = await detectarClientesAusentes(gimnasioId)
    
    if (clientesAusentes.length === 0) {
      console.log('No hay clientes ausentes para generar contenido')
      return []
    }

    const contenidoGenerado = []
    
    for (const cliente of clientesAusentes) {
      // Verificar si ya se generó contenido hoy para este cliente
      const hoy = getBuenosAiresDateString()
      
      // Crear tabla para tracking de contenido generado
      const { data: yaGenerado } = await supabase
        .from('ai_content_generated')
        .select('id')
        .eq('cliente_id', cliente.id)
        .eq('fecha_generacion', hoy)
        .single()

      if (!yaGenerado) {
        const contenido = await generarContenidoViral(cliente)
        contenidoGenerado.push(contenido)
        
        // Guardar que se generó contenido hoy
        await supabase
          .from('ai_content_generated')
          .insert({
            cliente_id: cliente.id,
            fecha_generacion: hoy,
            tipo_contenido: contenido.tipo,
            personalidad: contenido.personalidad
          })
      }
    }

    return contenidoGenerado
  } catch (error) {
    console.error('Error en chequeo de ausencias:', error)
    return []
  }
}