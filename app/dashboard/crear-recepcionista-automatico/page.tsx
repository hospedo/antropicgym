'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, UserPlus, Key, CheckCircle, Copy, ExternalLink, AlertTriangle } from 'lucide-react'

interface GimnasioInfo {
  id: string
  nombre: string
}

interface CreatedUser {
  id: string
  email: string
  nombre: string
  gimnasio: string
  rol: string
}

interface Credentials {
  email: string
  password: string
  loginUrl: string
}

export default function CrearRecepcionistaAutomatico() {
  const [gimnasioInfo, setGimnasioInfo] = useState<GimnasioInfo | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState('')

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
        setGimnasioInfo(gimnasio)
      }
    }

    obtenerGimnasio()
  }, [])

  const generarCredenciales = () => {
    if (!gimnasioInfo) return
    
    const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100)
    const email = `recepcion.${gimnasioInfo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}@gimnasio.local`
    
    setFormData({
      nombre: `Recepción ${gimnasioInfo.nombre}`,
      email,
      password
    })
  }

  const crearRecepcionista = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gimnasioInfo) {
      setError('No se encontró información del gimnasio')
      return
    }

    setLoading(true)
    setError('')
    setCreatedUser(null)
    setCredentials(null)

    try {
      // Obtener token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Error de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }

      // Llamar a la API para crear usuario
      const response = await fetch('/api/admin/create-reception-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando usuario')
      }

      // Éxito
      setCreatedUser(result.user)
      setCredentials(result.credentials)
      
      // Limpiar formulario
      setFormData({ nombre: '', email: '', password: '' })

    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error inesperado al crear el recepcionista')
    } finally {
      setLoading(false)
    }
  }

  const copiarTexto = async (texto: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(tipo)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Error copiando:', error)
    }
  }

  const abrirLogin = () => {
    if (credentials) {
      window.open(credentials.loginUrl, '_blank')
    }
  }

  if (!gimnasioInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Monitor className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Crear Usuario de Recepción (Automático)
            </h1>
            <p className="text-gray-600">
              Para: <strong>{gimnasioInfo.nombre}</strong>
            </p>
            <p className="text-sm text-green-600 font-medium">
              ✅ Creación 100% automática - Sin configuración manual
            </p>
          </div>
        </div>
      </div>

      {/* Generador automático */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🎯 Generar Credenciales</h3>
        <p className="text-blue-800 mb-4">
          Genera credenciales automáticas para tu gimnasio con un click
        </p>
        <button
          onClick={generarCredenciales}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Generar Credenciales Automáticamente</span>
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={crearRecepcionista} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Usuario
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Recepción Turno Mañana"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Acceso
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="recepcion@tugimnasio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contraseña segura"
              />
              <button
                type="button"
                onClick={() => {
                  const newPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100)
                  setFormData(prev => ({ ...prev, password: newPassword }))
                }}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Generar</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.nombre || !formData.email || !formData.password}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-lg font-semibold"
          >
            <CheckCircle className="h-6 w-6" />
            <span>{loading ? 'Creando Usuario...' : '🚀 Crear Recepcionista Automáticamente'}</span>
          </button>
        </form>
      </div>

      {/* Resultado exitoso */}
      {createdUser && credentials && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h3 className="text-xl font-bold text-green-900">
              ✅ ¡Recepcionista Creado Exitosamente!
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del usuario */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">👤 Usuario Creado</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nombre:</strong> {createdUser.nombre}</p>
                <p><strong>Email:</strong> {createdUser.email}</p>
                <p><strong>Gimnasio:</strong> {createdUser.gimnasio}</p>
                <p><strong>Rol:</strong> {createdUser.rol}</p>
              </div>
            </div>

            {/* Credenciales de acceso */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">🔑 Credenciales de Acceso</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Email:</p>
                    <p className="font-mono text-sm">{credentials.email}</p>
                  </div>
                  <button
                    onClick={() => copiarTexto(credentials.email, 'email')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Contraseña:</p>
                    <p className="font-mono text-sm">{credentials.password}</p>
                  </div>
                  <button
                    onClick={() => copiarTexto(credentials.password, 'password')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={abrirLogin}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Probar Login Ahora</span>
            </button>

            <button
              onClick={() => {
                const datos = `📧 Email: ${credentials.email}\n🔑 Contraseña: ${credentials.password}\n🌐 URL: ${credentials.loginUrl}`
                copiarTexto(datos, 'all')
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Copy className="h-5 w-5" />
              <span>{copied === 'all' ? '¡Copiado!' : 'Copiar Todo'}</span>
            </button>
          </div>

          {/* Instrucciones finales */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Instrucciones para la Recepción:</h4>
            <ol className="text-blue-800 text-sm space-y-1">
              <li>1. Ve a: <code className="bg-white px-1 rounded">{credentials.loginUrl}</code></li>
              <li>2. Inicia sesión con las credenciales proporcionadas</li>
              <li>3. Serás redirigido automáticamente a la pantalla de recepción</li>
              <li>4. ¡Listo para consultar clientes y registrar asistencias!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Información del proceso */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">ℹ️ ¿Qué hace este proceso automático?</h3>
        <ul className="text-gray-700 text-sm space-y-2">
          <li>• ✅ Crea automáticamente el usuario en la base de datos</li>
          <li>• ✅ Asigna permisos específicos para recepción</li>
          <li>• ✅ Vincula el usuario exclusivamente a tu gimnasio</li>
          <li>• ✅ Configura acceso solo a clientes de tu gimnasio</li>
          <li>• ✅ Genera credenciales seguras automáticamente</li>
          <li>• ✅ No requiere configuración manual en Supabase</li>
        </ul>
      </div>
    </div>
  )
}