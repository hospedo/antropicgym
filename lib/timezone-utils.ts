/**
 * Utilidades para manejo de timezone de Buenos Aires
 */

const BUENOS_AIRES_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en timezone de Buenos Aires
 */
export function getBuenosAiresDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BUENOS_AIRES_TIMEZONE }))
}

/**
 * Obtiene la fecha actual en formato ISO string en timezone de Buenos Aires
 */
export function getBuenosAiresISOString(): string {
  return getBuenosAiresDate().toISOString()
}

/**
 * Obtiene solo la fecha (YYYY-MM-DD) en timezone de Buenos Aires
 */
export function getBuenosAiresDateString(): string {
  return getBuenosAiresDate().toISOString().split('T')[0]
}

/**
 * Convierte una fecha a timezone de Buenos Aires
 */
export function toBuenosAiresDate(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: BUENOS_AIRES_TIMEZONE }))
}

/**
 * Obtiene timestamp actual en timezone de Buenos Aires
 */
export function getBuenosAiresTimestamp(): string {
  return getBuenosAiresDate().toISOString()
}