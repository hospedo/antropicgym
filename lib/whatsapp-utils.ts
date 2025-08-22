// Utilidades para enviar mensajes a WhatsApp Web

export interface ContenidoParaWhatsApp {
  titulo: string
  descripcion: string
  hashtags?: string[]
  texto_final?: string
  tipo: string
}

/**
 * Formatea el contenido para WhatsApp
 */
export function formatearMensajeWhatsApp(contenido: ContenidoParaWhatsApp): string {
  let mensaje = ''
  
  // Título con emojis según el tipo
  const emojiPorTipo: Record<string, string> = {
    'motivacional': '💪',
    'constancia': '🔥',
    'racha': '⚡',
    'regreso': '🌟',
    'nuevo': '👋',
    'meta': '🏆',
    'logro': '🎯',
    'celebracion': '🎉'
  }
  
  const emoji = emojiPorTipo[contenido.tipo] || '✨'
  mensaje += `${emoji} *${contenido.titulo}*\n\n`
  
  // Descripción principal
  mensaje += `${contenido.descripcion}\n\n`
  
  // Texto final si existe (ya formateado)
  if (contenido.texto_final) {
    mensaje += `${contenido.texto_final}\n\n`
  }
  
  // Hashtags
  if (contenido.hashtags && contenido.hashtags.length > 0) {
    mensaje += `${contenido.hashtags.join(' ')}`
  }
  
  return mensaje.trim()
}

/**
 * Abre WhatsApp Web con el mensaje pre-escrito
 */
export function enviarPorWhatsApp(mensaje: string, telefono?: string): void {
  // Codificar el mensaje para URL
  const mensajeCodificado = encodeURIComponent(mensaje)
  
  // Crear URL de WhatsApp Web
  let url = 'https://web.whatsapp.com/send'
  
  // Si se proporciona un teléfono, agregarlo
  if (telefono) {
    // Limpiar el teléfono (solo números)
    const telefonoLimpio = telefono.replace(/\D/g, '')
    url += `?phone=${telefonoLimpio}&`
  } else {
    url += '?'
  }
  
  url += `text=${mensajeCodificado}`
  
  // Abrir en nueva ventana
  window.open(url, '_blank')
}

/**
 * Copia el mensaje al portapapeles
 */
export async function copiarAlPortapapeles(mensaje: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(mensaje)
    return true
  } catch (err) {
    // Fallback para navegadores que no soportan clipboard API
    try {
      const textArea = document.createElement('textarea')
      textArea.value = mensaje
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackErr) {
      console.error('Error al copiar al portapapeles:', fallbackErr)
      return false
    }
  }
}

/**
 * Compartir usando la API nativa de compartir (móviles)
 */
export async function compartirContenido(contenido: ContenidoParaWhatsApp): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: contenido.titulo,
        text: formatearMensajeWhatsApp(contenido)
      })
      return true
    } catch (err) {
      console.error('Error al compartir:', err)
      return false
    }
  }
  return false
}