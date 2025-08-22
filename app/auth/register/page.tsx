'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { createInitialSubscription } from '@/lib/use-subscription'

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

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    try {
      // Paso 1: Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('Auth error:', authError)
        setError(`Error de autenticación: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario')
        return
      }

      console.log('User created successfully:', authData.user.id)

      // Paso 2: Crear entrada en tabla usuarios (con manejo de errores mejorado)
      try {
        const { error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: formData.email,
            nombre: formData.nombre,
            telefono: formData.telefono || null
          })

        if (userError) {
          console.error('Error inserting user:', userError)
          // Si es error de usuario ya existente, continúa
          if (userError.code !== '23505') { // 23505 es duplicate key
            setError(`Error al crear perfil de usuario: ${userError.message}`)
            return
          }
        }
        console.log('User profile created successfully')
      } catch (userInsertError) {
        console.error('Exception inserting user:', userInsertError)
        setError('Error al crear el perfil de usuario')
        return
      }

      // Paso 3: Crear gimnasio (con manejo de errores mejorado)
      try {
        const { data: gymData, error: gymError } = await supabase
          .from('gimnasios')
          .insert({
            usuario_id: authData.user.id,
            nombre: formData.nombreGimnasio,
            direccion: formData.direccion || null,
            telefono: formData.telefono || null,
            email: formData.email
          })
          .select()
          .single()

        if (gymError) {
          console.error('Error creating gym:', gymError)
          setError(`Error al crear el gimnasio: ${gymError.message}`)
          return
        }
        console.log('Gym created successfully:', gymData)
      } catch (gymInsertError) {
        console.error('Exception inserting gym:', gymInsertError)
        setError('Error al crear el gimnasio')
        return
      }

      // Paso 4: Intentar crear suscripción (sin bloquear el proceso)
      try {
        await createInitialSubscription(authData.user.id)
        console.log('Subscription created successfully')
      } catch (subscriptionError) {
        console.warn('Subscription creation failed, but continuing:', subscriptionError)
        // No bloquear el registro por esto
      }

      // Éxito: redirigir al dashboard
      console.log('Registration completed successfully')
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Unexpected registration error:', err)
      setError(`Error inesperado: ${err.message || 'Intenta nuevamente'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Registrar Gimnasio</h1>
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
            <div className="text-red-600 text-sm">{error}</div>
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