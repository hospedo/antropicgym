import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsem15emVvZHRiaHptc3dpdXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTUyNjU3NSwiZXhwIjoyMDQ3MTAyNTc1fQ.jzRcDlEj18yLgOPp4WnEHSM8TCtJNfGwJJXfAO8OKhY'

// Admin service role key para operaciones administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    
    console.log('🔍 Buscando usuario:', email)
    
    // Buscar usuario por email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error obteniendo usuarios:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    
    const user = users.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    
    console.log('✅ Usuario encontrado:', user.id)
    
    const now = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // Verificar suscripción existente
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', user.id)
      .single()
    
    if (subError && subError.code !== 'PGRST116') {
      console.error('Error verificando suscripción:', subError)
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }
    
    const subscriptionData = {
      status: 'active' as const,
      subscription_start_date: now.toISOString(),
      last_billing_date: now.toISOString(),
      next_billing_date: nextMonth.toISOString(),
      payment_method: 'admin_override',
      plan_type: 'monthly' as const,
      price_per_user: 150,
      max_users: 10,
      updated_at: now.toISOString()
    }
    
    if (existingSub) {
      // Actualizar suscripción existente
      console.log('🔄 Actualizando suscripción existente...')
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('usuario_id', user.id)
      
      if (updateError) {
        console.error('Error actualizando suscripción:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      console.log('✅ Suscripción actualizada')
      
    } else {
      // Crear nueva suscripción
      console.log('➕ Creando nueva suscripción...')
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          usuario_id: user.id,
          trial_start_date: now.toISOString(),
          trial_end_date: nextMonth.toISOString(),
          current_users_count: 1,
          ...subscriptionData
        })
      
      if (insertError) {
        console.error('Error creando suscripción:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      
      console.log('✅ Nueva suscripción creada')
    }
    
    // Verificar resultado final
    const { data: finalSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', user.id)
      .single()
    
    console.log('📋 Estado final:', {
      status: finalSub?.status,
      plan: finalSub?.plan_type,
      price: finalSub?.price_per_user,
      next_billing: finalSub?.next_billing_date
    })
    
    return NextResponse.json({
      success: true,
      message: `Plan básico asignado exitosamente a ${email}`,
      subscription: finalSub
    })
    
  } catch (error: any) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}