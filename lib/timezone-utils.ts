/**
 * Utilidades para manejo de timezone de Buenos Aires
 */

const BUENOS_AIRES_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en timezone de Buenos Aires
 */
export function getBuenosAiresDate(): Date {
  const now = new Date()
  // Crear nueva fecha ajustada al timezone de Buenos Aires
  const buenosAiresTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUENOS_AIRES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now)
  
  return new Date(buenosAiresTime.replace(',', ''))
}

/**
 * Obtiene la fecha actual en formato ISO string en timezone de Buenos Aires
 */
export function getBuenosAiresISOString(): string {
  const now = new Date()
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: BUENOS_AIRES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(now).replace(' ', 'T') + '.000Z'
}

/**
 * Obtiene solo la fecha (YYYY-MM-DD) en timezone de Buenos Aires
 */
export function getBuenosAiresDateString(): string {
  const now = new Date()
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: BUENOS_AIRES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}

/**
 * Convierte una fecha a timezone de Buenos Aires
 */
export function toBuenosAiresDate(date: Date): Date {
  const buenosAiresTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUENOS_AIRES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
  
  return new Date(buenosAiresTime.replace(',', ''))
}

/**
 * Obtiene timestamp actual en timezone de Buenos Aires
 */
export function getBuenosAiresTimestamp(): string {
  return getBuenosAiresISOString()
}