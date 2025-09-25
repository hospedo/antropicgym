const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vlzmyzeodtbhzmswiuwk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsem15emVvZHRiaHptc3dpdXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTUyNjU3NSwiZXhwIjoyMDQ3MTAyNTc1fQ.jzRcDlEj18yLgOPp4WnEHSM8TCtJNfGwJJXfAO8OKhY'
);

async function checkUser() {
  try {
    console.log('Verificando estado del usuario...');
    
    // Buscar usuario
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const user = users.users.find(u => u.email === 'lucascoria9.lc@gmail.com');
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.id);
    console.log('   Email:', user.email);
    
    // Verificar suscripción
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('usuario_id', user.id)
      .single();
    
    if (subError && subError.code !== 'PGRST116') {
      console.error('❌ Error consultando suscripción:', subError.message);
      return;
    }
    
    if (sub) {
      console.log('📋 Suscripción encontrada:');
      console.log('   Status:', sub.status);
      console.log('   Plan:', sub.plan_type);
      console.log('   Precio:', '$' + sub.price_per_user);
      console.log('   Método de pago:', sub.payment_method);
      console.log('   Próximo pago:', sub.next_billing_date);
      console.log('   Usuarios máximos:', sub.max_users);
    } else {
      console.log('❌ No se encontró suscripción para este usuario');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUser();