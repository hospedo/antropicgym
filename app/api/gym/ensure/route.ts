import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gymService, GymService } from '@/lib/gym-service'

// Create admin client for operations that need elevated permissions
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create admin client for verification
    const supabaseAdmin = createSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error: Missing environment variables' 
      }, { status: 500 })
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    console.log('Ensuring gym exists for user:', user.id)

    // Use the gym service with admin client for elevated permissions
    const adminGymService = new GymService(supabaseAdmin)
    
    // Try to ensure the user has a gym
    const gymResult = await adminGymService.ensureUserHasGym(
      user.id,
      user.user_metadata,
      user.email || undefined
    )

    if (!gymResult.success) {
      console.error('Failed to ensure gym for user:', gymResult.error, gymResult.details)
      return NextResponse.json({
        success: false,
        error: gymResult.error,
        details: gymResult.details
      }, { status: 400 })
    }

    // Also ensure user profile exists
    try {
      const { error: userProfileError } = await supabaseAdmin
        .from('usuarios')
        .upsert({
          id: user.id,
          email: user.email || '',
          nombre: user.user_metadata?.nombre || '',
          telefono: user.user_metadata?.telefono || null
        }, { onConflict: 'id' })

      if (userProfileError) {
        console.error('User profile creation/update failed:', userProfileError)
        // Don't fail the request for this, gym creation is more important
      }
    } catch (profileError) {
      console.error('User profile error:', profileError)
    }

    return NextResponse.json({
      success: true,
      gym: gymResult.gym,
      message: gymResult.error ? 'Gym retrieved (already existed)' : 'Gym created successfully'
    })

  } catch (error) {
    console.error('Unexpected error in gym ensure endpoint:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create admin client for verification
    const supabaseAdmin = createSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error: Missing environment variables' 
      }, { status: 500 })
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Check if user has a gym
    const { data: gym, error: gymError } = await supabaseAdmin
      .from('gimnasios')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (gymError && gymError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: 'Error checking gym status',
        details: gymError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      hasGym: !!gym,
      gym: gym || null,
      userMetadata: user.user_metadata || null
    })

  } catch (error) {
    console.error('Unexpected error in gym status check:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}