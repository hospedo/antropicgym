import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Cliente de Supabase con clave de servicio para operaciones admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clave de servicio
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del usuario actual
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar que el token sea válido y obtener usuario
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que el usuario sea dueño de un gimnasio
    const { data: gimnasio, error: gymError } = await supabaseAdmin
      .from('gimnasios')
      .select('id, nombre')
      .eq('usuario_id', user.id)
      .single()

    if (gymError || !gimnasio) {
      return NextResponse.json({ 
        error: 'Usuario no autorizado: debe ser dueño de un gimnasio' 
      }, { status: 403 })
    }

    // Obtener datos del formulario
    const body = await request.json()
    const { nombre, email, password } = body

    if (!nombre || !email || !password) {
      return NextResponse.json({ 
        error: 'Campos requeridos: nombre, email, password' 
      }, { status: 400 })
    }

    // Validar email único
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser.users.some(u => u.email === email)
    
    if (emailExists) {
      return NextResponse.json({ 
        error: 'El email ya está registrado en el sistema' 
      }, { status: 400 })
    }

    // 1. Crear usuario en auth.users con admin API
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirmar email
    })

    if (createUserError || !newUser.user) {
      console.error('Error creando usuario:', createUserError)
      return NextResponse.json({ 
        error: `Error creando usuario: ${createUserError?.message}` 
      }, { status: 500 })
    }

    // 2. Insertar en tabla usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: newUser.user.id,
        email,
        nombre,
        rol: 'recepcionista'
      })

    if (usuarioError) {
      // Si falla, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      console.error('Error insertando usuario:', usuarioError)
      return NextResponse.json({ 
        error: `Error creando perfil: ${usuarioError.message}` 
      }, { status: 500 })
    }

    // 3. Insertar en usuarios_gimnasios (asignar al gimnasio)
    const { error: asignacionError } = await supabaseAdmin
      .from('usuarios_gimnasios')
      .insert({
        usuario_id: newUser.user.id,
        gimnasio_id: gimnasio.id,
        permisos: {
          consultas: true,
          asistencias: true
        }
      })

    if (asignacionError) {
      // Si falla, limpiar usuario creado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', newUser.user.id)
      
      console.error('Error asignando gimnasio:', asignacionError)
      return NextResponse.json({ 
        error: `Error asignando gimnasio: ${asignacionError.message}` 
      }, { status: 500 })
    }

    // Éxito - retornar datos del usuario creado
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email,
        nombre,
        gimnasio: gimnasio.nombre,
        rol: 'recepcionista'
      },
      credentials: {
        email,
        password, // Para mostrar al dueño del gym
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`
      }
    })

  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}