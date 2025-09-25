/**
 * Script para asignar plan básico a un usuario específico
 * Uso: node scripts/assign-basic-plan.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const SUPABASE_URL = 'https://vlzmyzeodtbhzmswiuwk.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsem15emVvZHRiaHptc3dpdXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTUyNjU3NSwiZXhwIjoyMDQ3MTAyNTc1fQ.jzRcDlEj18yLgOPp4WnEHSM8TCtJNfGwJJXfAO8OKhY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const USER_EMAIL = 'lucascoria9.lc@gmail.com'

async function assignBasicPlan() {
  try {
    console.log(`🔍 Buscando usuario con email: ${USER_EMAIL}`)
    
    // 1. Buscar el usuario por email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      throw new Error(`Error obteniendo usuarios: ${userError.message}`)
    }
    
    const targetUser = user.users.find(u => u.email === USER_EMAIL)
    
    if (!targetUser) {
      throw new Error(`Usuario con email ${USER_EMAIL} no encontrado`)
    }
    
    console.log(`✅ Usuario encontrado: ${targetUser.id}`)
    
    // 2. Verificar si ya tiene una suscripción
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', targetUser.id)
      .single()
    
    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Error verificando suscripción: ${subError.message}`)
    }
    
    const now = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    if (existingSub) {
      // 3. Actualizar suscripción existente a plan básico
      console.log('🔄 Actualizando suscripción existente...')
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_start_date: now.toISOString(),
          last_billing_date: now.toISOString(),
          next_billing_date: nextMonth.toISOString(),
          payment_method: 'admin_override',
          plan_type: 'monthly',
          price_per_user: 150,
          max_users: 10,
          updated_at: now.toISOString()
        })
        .eq('usuario_id', targetUser.id)
      
      if (updateError) {
        throw new Error(`Error actualizando suscripción: ${updateError.message}`)
      }
      
      console.log('✅ Suscripción actualizada a plan básico')
      
    } else {
      // 4. Crear nueva suscripción con plan básico
      console.log('➕ Creando nueva suscripción...')
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          usuario_id: targetUser.id,
          status: 'active',
          trial_start_date: now.toISOString(),
          trial_end_date: nextMonth.toISOString(), // Darle un mes extra
          subscription_start_date: now.toISOString(),
          last_billing_date: now.toISOString(),
          next_billing_date: nextMonth.toISOString(),
          payment_method: 'admin_override',
          plan_type: 'monthly',
          price_per_user: 150,
          max_users: 10,
          current_users_count: 1
        })
      
      if (insertError) {
        throw new Error(`Error creando suscripción: ${insertError.message}`)
      }
      
      console.log('✅ Nueva suscripción creada con plan básico')
    }
    
    // 5. Verificar el resultado
    const { data: finalSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', targetUser.id)
      .single()
    
    console.log('📋 Estado final de la suscripción:')
    console.log(`   - Status: ${finalSub?.status}`)
    console.log(`   - Plan: ${finalSub?.plan_type}`)
    console.log(`   - Precio: $${finalSub?.price_per_user}`)
    console.log(`   - Próximo pago: ${finalSub?.next_billing_date}`)
    console.log(`   - Método de pago: ${finalSub?.payment_method}`)
    
    console.log(`\n🎉 ¡Plan básico asignado exitosamente a ${USER_EMAIL}!`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
assignBasicPlan()