'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

    try {
      // PASO 1: Crear usuario en Supabase Auth
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

      console.log('User created successfully')

      // PASO 2: Si requiere confirmación por email
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        setSuccess('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
        return
      }

      // PASO 3: Si el usuario está confirmado automáticamente
      if (authData.session) {
        console.log('User auto-confirmed, database trigger should create records automatically...')
        
        // Esperar un momento para que el trigger de base de datos funcione
        setTimeout(() => {
          setSuccess('¡Registro exitoso! El sistema creará automáticamente tu gimnasio. Redirigiendo al dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }, 1000)
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
          <h1 className="text-2xl font-bold text-red-600">De0a100</h1>
          <p className="text-gray-600">Tu gym, de 0 a 100 🏔️</p>
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Gimnasio'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-red-600 hover:text-red-700">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}