'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, UserPlus, Key } from 'lucide-react'

export default function CrearRecepcionista() {
  const [gimnasioId, setGimnasioId] = useState<string>('')
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const obtenerGimnasio = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id, nombre')
        .eq('usuario_id', user.id)
        .single()

      if (gimnasio) {
        setGimnasioId(gimnasio.id)
      }
    }

    obtenerGimnasio()
  }, [])

  const crearInstrucciones = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Solo generar las instrucciones para crear manualmente
      setSuccess(`📋 INSTRUCCIONES PARA CREAR RECEPCIONISTA:

🔧 PASO 1: Crear usuario en Supabase
1. Ve a tu dashboard de Supabase
2. Authentication → Users
3. Haz clic en "Add user"
4. Email: ${formData.email}
5. Password: ${formData.password}
6. Confirma la creación

🔧 PASO 2: Ejecutar este SQL en Supabase
Copia y pega este código en SQL Editor:

\`\`\`sql
-- Obtener el ID del usuario recién creado
SELECT id FROM auth.users WHERE email = '${formData.email}';

-- Copiar el ID y usarlo en estos INSERT (reemplaza 'USER_ID_AQUI')
INSERT INTO public.usuarios (id, email, nombre, rol) 
VALUES ('USER_ID_AQUI', '${formData.email}', '${formData.nombre}', 'recepcionista');

INSERT INTO public.usuarios_gimnasios (usuario_id, gimnasio_id, permisos)
VALUES ('USER_ID_AQUI', '${gimnasioId}', '{"consultas": true, "asistencias": true}');
\`\`\`

📱 DATOS DE ACCESO PARA RECEPCIÓN:
👤 Nombre: ${formData.nombre}
📧 Email: ${formData.email}  
🔑 Contraseña: ${formData.password}
🌐 URL: ${window.location.origin}/recepcion

⚠️ Guarda estos datos para la recepción`)

      // Limpiar formulario
      setFormData({ nombre: '', email: '', password: '' })

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const generarPassword = () => {
    const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100)
    setFormData(prev => ({ ...prev, password }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Crear Usuario de Recepción
            </h1>
            <p className="text-gray-600">
              Crea un usuario con acceso limitado para la computadora de recepción
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={crearInstrucciones} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Recepcionista
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Recepción Turno Mañana"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email de Acceso
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="recepcion@tugimnasio.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contraseña segura"
              />
              <button
                type="button"
                onClick={generarPassword}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Generar</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <pre className="text-green-800 text-sm whitespace-pre-line">{success}</pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <UserPlus className="h-5 w-5" />
            <span>{loading ? 'Generando...' : 'Generar Instrucciones'}</span>
          </button>
        </form>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Información Importante:</h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>• El usuario de recepción solo puede acceder a <strong>/recepcion</strong></li>
          <li>• Puede consultar información de clientes y registrar asistencias</li>
          <li>• NO tiene acceso al dashboard principal ni datos sensibles</li>
          <li>• Perfecto para la computadora de recepción</li>
          <li>• Puedes crear múltiples usuarios (turno mañana, tarde, etc.)</li>
        </ul>
      </div>
    </div>
  )
}