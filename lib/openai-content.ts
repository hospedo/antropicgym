// Generador de contenido viral usando OpenAI
import { ContenidoViral, ClienteAusencia } from './ai-coach'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// Configuración de API (usa variable de entorno)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

export async function generarMemeConIA(cliente: ClienteAusencia): Promise<ContenidoViral> {
  if (!OPENAI_API_KEY) {
    // Fallback sin IA
    return generarMemeSimple(cliente)
  }

  try {
    const prompt = crearPromptMeme(cliente)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un creador de contenido viral para gimnasios. Generas memes divertidos y engagement sobre miembros que no van al gym. Responde SOLO en formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data: OpenAIResponse = await response.json()
    const contenidoIA = JSON.parse(data.choices[0].message.content)

    return {
      tipo: 'meme',
      titulo: contenidoIA.titulo,
      descripcion: contenidoIA.descripcion,
      personalidad: contenidoIA.personalidad,
      cliente_nombre: `${cliente.nombre} ${cliente.apellido}`,
      dias_ausencia: cliente.dias_sin_venir,
      hashtags: contenidoIA.hashtags,
      prompt_imagen: contenidoIA.prompt_imagen
    }
    
  } catch (error) {
    console.error('Error generando contenido con IA:', error)
    // Fallback sin IA
    return generarMemeSimple(cliente)
  }
}

function crearPromptMeme(cliente: ClienteAusencia): string {
  return `
Genera un meme viral divertido para un gimnasio sobre un miembro que lleva ${cliente.dias_sin_venir} días sin ir.

DATOS DEL MIEMBRO:
- Nombre: ${cliente.nombre} ${cliente.apellido}
- Días sin ir: ${cliente.dias_sin_venir}
- Gimnasio: ${cliente.gimnasio.nombre}

PERSONALIDADES DISPONIBLES (elige 1):
1. "Coach Motivador" - tono inspiracional y energético
2. "Coach Sarcástico" - tono divertido y sarcástico  
3. "Abuela Fitness" - tono cariñoso pero regañón
4. "Dr. Datos" - tono científico y analítico

INSTRUCCIONES:
- Haz que sea VIRAL y divertido
- Usa humor apropiado para redes sociales
- Menciona los días de ausencia de manera creativa
- Debe generar engagement y shares
- Incluye emojis relevantes

RESPONDE EN ESTE FORMATO JSON EXACTO:
{
  "titulo": "Título pegajoso del meme",
  "descripcion": "Descripción viral del contenido (max 280 caracteres)",
  "personalidad": "Nombre de la personalidad elegida",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "prompt_imagen": "Descripción detallada para generar imagen del meme"
}
`
}

// Fallback sin IA - contenido preestablecido
function generarMemeSimple(cliente: ClienteAusencia): ContenidoViral {
  const personalidades = [
    {
      nombre: "Coach Motivador",
      frases: [`¡${cliente.nombre}, tu cuerpo te está esperando hace ${cliente.dias_sin_venir} días! 💪`]
    },
    {
      nombre: "Coach Sarcástico", 
      frases: [`${cliente.nombre} lleva ${cliente.dias_sin_venir} días "descansando"... Las pesas preguntan si sigues vivo 😏`]
    },
    {
      nombre: "Abuela Fitness",
      frases: [`Mijo ${cliente.nombre}, ¿dónde andas? Tu abuela fitness está preocupada después de ${cliente.dias_sin_venir} días 👵💪`]
    }
  ]

  const personalidad = personalidades[Math.floor(Math.random() * personalidades.length)]
  
  return {
    tipo: 'meme',
    titulo: `${personalidad.nombre} busca a ${cliente.nombre}`,
    descripcion: personalidad.frases[0],
    personalidad: personalidad.nombre,
    cliente_nombre: `${cliente.nombre} ${cliente.apellido}`,
    dias_ausencia: cliente.dias_sin_venir,
    hashtags: ['#GymAI', '#FitnessMotivation', '#GymLife', '#AICoach', `#${cliente.gimnasio.nombre.replace(/\s+/g, '')}`],
    prompt_imagen: `${personalidad.nombre} en un gimnasio buscando a ${cliente.nombre}, estilo cartoon divertido, con texto "${personalidad.frases[0].substring(0, 50)}..."`
  }
}

// Generar imagen con DALL-E (opcional)
export async function generarImagenMeme(promptImagen: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: promptImagen,
        n: 1,
        size: '1024x1024',
        style: 'vivid'
      })
    })

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].url
    
  } catch (error) {
    console.error('Error generando imagen:', error)
    return null
  }
}

// Crear contenido completo (texto + imagen)
export async function crearContenidoCompleto(cliente: ClienteAusencia) {
  const contenido = await generarMemeConIA(cliente)
  const imagenUrl = await generarImagenMeme(contenido.prompt_imagen)
  
  return {
    ...contenido,
    imagen_url: imagenUrl,
    listo_para_publicar: true,
    texto_final: `${contenido.descripcion}\n\n${contenido.hashtags.join(' ')}`
  }
}