// Utilidades para manejo de fechas

/**
 * Formatea una fecha de manera segura, manejando valores inválidos
 * @param dateValue - Valor de fecha (string, Date, null, undefined)
 * @returns Fecha formateada o mensaje de error
 */
export function formatDateSafe(dateValue: string | Date | null | undefined): string {
  if (!dateValue) {
    return '⚠️ Sin fecha'
  }

  try {
    const date = new Date(dateValue)
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '⚠️ Fecha inválida'
    }

    // Formatear usando el formato argentino DD/MM/YYYY
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    return '⚠️ Error de fecha'
  }
}

/**
 * Formatea una fecha de input HTML (YYYY-MM-DD) a formato argentino DD/MM/YYYY
 * @param inputDateValue - Fecha en formato YYYY-MM-DD del input HTML
 * @returns Fecha formateada DD/MM/YYYY
 */
export function formatInputDate(inputDateValue: string): string {
  if (!inputDateValue) return '⚠️ Sin fecha'
  
  try {
    // El input date devuelve formato YYYY-MM-DD
    const [year, month, day] = inputDateValue.split('-').map(Number)
    
    if (!year || !month || !day) {
      return '⚠️ Fecha inválida'
    }
    
    // Crear fecha (month - 1 porque Date usa meses basados en 0)
    const date = new Date(year, month - 1, day)
    
    if (isNaN(date.getTime())) {
      return '⚠️ Fecha inválida'
    }
    
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '⚠️ Error de fecha'
  }
}

/**
 * Verifica si una fecha es válida
 * @param dateValue - Valor de fecha a verificar
 * @returns true si la fecha es válida
 */
export function isValidDate(dateValue: string | Date | null | undefined): boolean {
  if (!dateValue) return false
  
  try {
    const date = new Date(dateValue)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Convierte una fecha a formato ISO para base de datos (YYYY-MM-DD)
 * @param dateValue - Valor de fecha
 * @returns String en formato YYYY-MM-DD o null si es inválida
 */
export function toISODateString(dateValue: string | Date | null | undefined): string | null {
  if (!isValidDate(dateValue)) return null
  
  try {
    const date = new Date(dateValue!)
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

/**
 * Verifica si una membresía está activa
 * @param estado - Estado de la inscripción
 * @param fechaFin - Fecha de fin de la inscripción
 * @returns true si está activa
 */
export function isMembershipActive(estado: string, fechaFin: string | Date | null | undefined): boolean {
  if (estado !== 'activa') return false
  if (!isValidDate(fechaFin)) return false
  
  try {
    const finDate = new Date(fechaFin!)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Solo comparar fechas, no horas
    
    return finDate >= today
  } catch {
    return false
  }
}