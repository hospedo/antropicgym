const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vlzmyzeodtbhzmswiuwk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsem15emVvZHRiaHptc3dpdXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTUyNjU3NSwiZXhwIjoyMDQ3MTAyNTc1fQ.jzRcDlEj18yLgOPp4WnEHSM8TCtJNfGwJJXfAO8OKhY'
);

async function main() {
  try {
    console.log('Iniciando proceso...');
    
    // Buscar usuario
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const user = users.users.find(u => u.email === 'lucascoria9.lc@gmail.com');
    if (!user) throw new Error('Usuario no encontrado');
    
    console.log('Usuario encontrado:', user.id);
    
    // Fechas
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Verificar suscripción existente
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', user.id)
      .single();
    
    if (sub) {
      // Actualizar
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_start_date: now.toISOString(),
          last_billing_date: now.toISOString(),
          next_billing_date: nextMonth.toISOString(),
          payment_method: 'admin_override',
          plan_type: 'monthly',
          price_per_user: 150,
          max_users: 10
        })
        .eq('usuario_id', user.id);
      
      if (error) throw error;
      console.log('Suscripción actualizada');
    } else {
      // Crear nueva
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          usuario_id: user.id,
          status: 'active',
          trial_start_date: now.toISOString(),
          trial_end_date: nextMonth.toISOString(),
          subscription_start_date: now.toISOString(),
          last_billing_date: now.toISOString(),
          next_billing_date: nextMonth.toISOString(),
          payment_method: 'admin_override',
          plan_type: 'monthly',
          price_per_user: 150,
          max_users: 10,
          current_users_count: 1
        });
      
      if (error) throw error;
      console.log('Nueva suscripción creada');
    }
    
    console.log('✅ Plan básico asignado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();