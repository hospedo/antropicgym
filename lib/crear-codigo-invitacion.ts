import { supabase } from './supabase'
import { generateInvitationCode } from './invitations'

// Crear código de invitación para cliente existente (sin crear cuenta auth)
export async function crearCodigoParaCliente(clienteId: string) {
  try {
    // Obtener datos del cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, email, gimnasio_id')
      .eq('id', clienteId)
      .single()

    if (clienteError || !cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    if (!cliente.email) {
      return { success: false, error: 'Cliente no tiene email registrado' }
    }

    // Verificar si ya tiene código de invitación activo
    const { data: codigoExistente } = await supabase
      .from('invitaciones')
      .select('codigo, expires_at, usado')
      .eq('cliente_id', clienteId)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (codigoExistente) {
      return { 
        success: true, 
        codigo: codigoExistente.codigo,
        mensaje: 'Ya existe un código activo',
        cliente
      }
    }

    // Crear nuevo código de invitación
    const codigo = generateInvitationCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 días de validez

    const { data: invitacion, error: invitacionError } = await supabase
      .from('invitaciones')
      .insert({
        gimnasio_id: cliente.gimnasio_id,
        cliente_id: clienteId,
        codigo,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (invitacionError) {
      return { success: false, error: invitacionError.message }
    }

    return { 
      success: true, 
      codigo,
      mensaje: 'Código de invitación creado exitosamente',
      cliente,
      linkRegistro: `/auth/register-member?codigo=${codigo}`
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}