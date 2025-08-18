import { supabase } from './supabase'

// Generar código de invitación simple
export function generateInvitationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Crear invitación para un cliente
export async function createInvitation(gimnasioId: string, clienteId: string) {
  const codigo = generateInvitationCode()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días
  
  const { data, error } = await supabase
    .from('invitaciones')
    .insert({
      gimnasio_id: gimnasioId,
      cliente_id: clienteId,
      codigo,
      expires_at: expiresAt.toISOString()
    })
    .select('*, clientes(nombre, apellido, email)')
    .single()
    
  return { data, error }
}

// Verificar código de invitación
export async function verifyInvitationCode(codigo: string) {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*, clientes(id, nombre, apellido, email, gimnasio_id), gimnasios(nombre)')
    .eq('codigo', codigo)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .single()
    
  return { data, error }
}

// Usar código de invitación (marcar como usado)
export async function useInvitationCode(invitacionId: string, userId: string) {
  const { error: updateInvitationError } = await supabase
    .from('invitaciones')
    .update({ usado: true })
    .eq('id', invitacionId)
  
  if (updateInvitationError) {
    return { error: updateInvitationError }
  }
  
  // Obtener datos de la invitación para actualizar cliente
  const { data: invitacion } = await supabase
    .from('invitaciones')
    .select('cliente_id')
    .eq('id', invitacionId)
    .single()
  
  if (!invitacion) {
    return { error: { message: 'Invitación no encontrada' } }
  }
  
  // Conectar cliente con usuario
  const { error: updateClientError } = await supabase
    .from('clientes')
    .update({ usuario_id: userId })
    .eq('id', invitacion.cliente_id)
  
  return { error: updateClientError }
}

// Obtener invitaciones de un gimnasio
export async function getInvitationsByGym(gimnasioId: string) {
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*, clientes(nombre, apellido, email)')
    .eq('gimnasio_id', gimnasioId)
    .order('created_at', { ascending: false })
    
  return { data, error }
}