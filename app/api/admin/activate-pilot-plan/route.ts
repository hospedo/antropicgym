import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crear cliente de Supabase con service role key para operaciones admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Función para activar plan piloto para Lucas Coria
export async function POST(request: NextRequest) {
  try {
    const { email, unlimited = true } = await request.json()

    // Solo permitir para Lucas Coria (medida de seguridad)
    if (!email || (!email.includes('lucas') && !email.includes('coria'))) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autorizado - Solo para programa piloto' 
      }, { status: 403 })
    }

    console.log('Activating pilot plan for:', email)

    // Buscar el usuario por email en la tabla de gimnasios
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from('gimnasios')
      .select('id, nombre, usuario_id, email')
      .or(`email.ilike.%lucas%,email.ilike.%coria%,email.eq.${email}`)
      .single()

    if (gymError || !gymData) {
      // Intentar buscar por nombre del gimnasio
      const { data: gymByName } = await supabaseAdmin
        .from('gimnasios')
        .select('id, nombre, usuario_id, email')
        .or(`nombre.ilike.%lucas%,nombre.ilike.%coria%`)
        .limit(1)
        .single()

      if (!gymByName) {
        return NextResponse.json({ 
          success: false, 
          error: 'Gimnasio de Lucas Coria no encontrado. Asegúrate de que esté registrado.' 
        }, { status: 404 })
      }
      
      // Usar los datos encontrados por nombre
      console.log('Found gym by name:', gymByName)
      const userId = gymByName.usuario_id
      
      // Continuar con la activación usando el gimnasio encontrado
      return await activatePilotPlan(userId, gymByName.id, unlimited, gymByName.email || email)
    }

    console.log('Found gym:', gymData.email, gymData.usuario_id)
    
    return await activatePilotPlan(gymData.usuario_id, gymData.id, unlimited, gymData.email || email)

  } catch (error: any) {
    console.error('Error activating pilot plan:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Función auxiliar para activar el plan piloto
async function activatePilotPlan(userId: string, gymId: string, unlimited: boolean, email: string) {
  // Verificar si ya tiene suscripción
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('usuario_id', userId)
    .single()

  const now = new Date()
  const tenYearsLater = new Date()
  tenYearsLater.setFullYear(tenYearsLater.getFullYear() + 10)

  if (existingSubscription) {
    // Actualizar suscripción existente a plan ilimitado
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: 'yearly',
        price_per_user: 0, // Sin costo
        max_users: unlimited ? 999999 : 100, // Usuarios ilimitados o 100 máximo
        subscription_start_date: now.toISOString(),
        subscription_end_date: tenYearsLater.toISOString(), // 10 años
        last_billing_date: now.toISOString(),
        next_billing_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año después
        payment_method: 'pilot_program',
        updated_at: now.toISOString()
      })
      .eq('usuario_id', userId)

    if (updateError) {
      throw updateError
    }

    console.log('Updated existing subscription to pilot plan')
  } else {
    // Crear nueva suscripción ilimitada
    const { error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        usuario_id: userId,
        gimnasio_id: gymId,
        status: 'active',
        plan_type: 'yearly',
        price_per_user: 0, // Sin costo
        max_users: unlimited ? 999999 : 100, // Usuarios ilimitados o 100 máximo
        current_users_count: 1,
        trial_start_date: now.toISOString(),
        trial_end_date: tenYearsLater.toISOString(),
        subscription_start_date: now.toISOString(),
        subscription_end_date: tenYearsLater.toISOString(),
        last_billing_date: now.toISOString(),
        next_billing_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'pilot_program',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })

    if (insertError) {
      throw insertError
    }

    console.log('Created new pilot subscription')
  }

  // Obtener información del gimnasio para la respuesta
  const { data: gymInfo } = await supabaseAdmin
    .from('gimnasios')
    .select('nombre')
    .eq('id', gymId)
    .single()

  return NextResponse.json({
    success: true,
    message: `Plan piloto ${unlimited ? 'ilimitado' : 'premium'} activado para ${email}`,
    details: {
      usuario: email,
      gimnasio: gymInfo?.nombre || 'No encontrado',
      plan: unlimited ? 'Ilimitado (10 años)' : 'Premium (10 años)',
      usuarios_maximos: unlimited ? 'Sin límite' : '100',
      costo: 'Gratuito (programa piloto)'
    }
  })
}

// Función para verificar el estado del plan piloto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email requerido' 
      }, { status: 400 })
    }

    // Buscar el gimnasio por email
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from('gimnasios')
      .select('id, nombre, usuario_id, email')
      .or(`email.ilike.%lucas%,email.ilike.%coria%,email.eq.${email}`)
      .single()

    if (gymError || !gymData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gimnasio no encontrado' 
      }, { status: 404 })
    }

    // Buscar la suscripción
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', gymData.usuario_id)
      .single()

    if (subError) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay suscripción activa' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        plan_type: subscription.plan_type,
        max_users: subscription.max_users,
        price_per_user: subscription.price_per_user,
        subscription_end_date: subscription.subscription_end_date,
        payment_method: subscription.payment_method,
        is_pilot: subscription.payment_method === 'pilot_program'
      }
    })

  } catch (error: any) {
    console.error('Error checking pilot plan:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}