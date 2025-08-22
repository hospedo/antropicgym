'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { gymService } from '@/lib/gym-service'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    nombreGimnasio: '',
    telefono: '',
    direccion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    let createdUser: any = null

    try {
      // Step 1: Create user in Supabase Auth
      console.log('Creating user in Supabase Auth...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            telefono: formData.telefono,
            nombreGimnasio: formData.nombreGimnasio,
            direccion: formData.direccion
          }
        }
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        if (authError.message.includes('Email rate limit exceeded')) {
          setError('Demasiados intentos. Espera unos minutos antes de intentar nuevamente.')
        } else if (authError.message.includes('already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.')
        } else {
          setError(`Error: ${authError.message}`)
        }
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario')
        return
      }

      createdUser = authData.user
      console.log('User created successfully:', createdUser.id)

      // Si se requiere confirmación por email
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        setSuccess('¡Registro exitoso! Revisa tu email para confirmar tu cuenta y completar el proceso.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
        return
      }

      // Si el usuario está confirmado automáticamente
      if (authData.session) {
        console.log('User auto-confirmed, creating gym...')
        
        // Step 2: Create gym using robust service
        const gymCreationResult = await gymService.createGymFromAuthMetadata(
          authData.user.id,
          {
            nombre: formData.nombre,
            nombreGimnasio: formData.nombreGimnasio,
            telefono: formData.telefono,
            direccion: formData.direccion
          },
          formData.email
        )

        if (!gymCreationResult.success) {
          console.error('Gym creation failed:', gymCreationResult.error, gymCreationResult.details)
          
          // Don't block registration entirely, but warn user and provide recovery
          console.log('Gym creation failed, but user registration will continue')
          setError(`⚠️ Advertencia: El gimnasio no se pudo crear automáticamente. Error: ${gymCreationResult.error}. No te preocupes, podrás configurarlo desde la página de Configuración una vez que ingreses al dashboard.`)
          
          // Continue with user profile creation, they can fix gym later
        } else {
          console.log('Gym created successfully:', gymCreationResult.gym)
        }

        // Step 3: Create user profile in usuarios table
        try {
          const { error: usuarioError } = await supabase
            .from('usuarios')
            .insert({
              id: authData.user.id,
              email: formData.email,
              nombre: formData.nombre,
              telefono: formData.telefono || null
            })

          if (usuarioError) {
            console.error('User profile creation failed:', usuarioError)
            // This is not critical, the user can be created later from auth metadata
          }
        } catch (profileError) {
          console.error('User profile creation error:', profileError)
          // This is not critical, continue with registration
        }

        setSuccess('¡Registro exitoso! Gimnasio creado correctamente. Redirigiendo al dashboard...')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }

    } catch (err: any) {
      console.error('Registration error:', err)
      setError('Error inesperado durante el registro. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ANTROPIC</h1>
          <p className="text-gray-600">Crea tu cuenta y configura tu gimnasio</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Tu Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label htmlFor="nombreGimnasio" className="block text-sm font-medium text-gray-700">
              Nombre del Gimnasio
            </label>
            <input
              id="nombreGimnasio"
              name="nombreGimnasio"
              type="text"
              value={formData.nombreGimnasio}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fitness Center"
            />
          </div>

          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
              Dirección del Gimnasio
            </label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Calle Principal 123"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Gimnasio'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}