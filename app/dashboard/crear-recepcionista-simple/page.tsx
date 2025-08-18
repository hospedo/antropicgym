'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, UserPlus, Copy, CheckCircle } from 'lucide-react'

export default function CrearRecepcionistaSimple() {
  const [gimnasioInfo, setGimnasioInfo] = useState<{id: string, nombre: string} | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
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
    const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100)
    const email = `recepcion.${gimnasioInfo?.nombre.toLowerCase().replace(/\s+/g, '')}@gimnasio.com`
    
    setFormData({
      nombre: `Recepción ${gimnasioInfo?.nombre}`,
      email,
      password
    })
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

  const crearCredenciales = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gimnasioInfo) {
      setError('No se encontró información del gimnasio')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Crear las instrucciones completas
      const instrucciones = `🏃‍♂️ CREDENCIALES DE RECEPCIÓN - ${gimnasioInfo.nombre}

📧 Email: ${formData.email}
🔑 Contraseña: ${formData.password}
👤 Nombre: ${formData.nombre}
🌐 URL de Acceso: ${window.location.origin}/auth/login

🔧 PASOS PARA ACTIVAR:

1️⃣ CREAR USUARIO EN SUPABASE:
   • Ve a tu dashboard de Supabase
   • Authentication → Users → Add user
   • Email: ${formData.email}
   • Password: ${formData.password}
   • Confirma la creación

2️⃣ EJECUTAR SQL EN SUPABASE:
   • Ve a SQL Editor en Supabase
   • Copia y ejecuta el siguiente código:

-- Obtener ID del usuario recién creado
SELECT id FROM auth.users WHERE email = '${formData.email}';

-- Insertar en tabla usuarios (reemplaza 'USER_ID_AQUI' con el ID obtenido)
INSERT INTO public.usuarios (id, email, nombre, rol) 
VALUES ('USER_ID_AQUI', '${formData.email}', '${formData.nombre}', 'recepcionista');

-- Asignar al gimnasio con permisos de recepción
INSERT INTO public.usuarios_gimnasios (usuario_id, gimnasio_id, permisos)
VALUES ('USER_ID_AQUI', '${gimnasioInfo.id}', '{"consultas": true, "asistencias": true}');

3️⃣ CONFIGURAR COMPUTADORA RECEPCIÓN:
   • Abrir navegador en: ${window.location.origin}/auth/login
   • Iniciar sesión con las credenciales
   • Navegar a: ${window.location.origin}/recepcion
   • ¡Listo para usar!

⚠️ IMPORTANTE: 
   • Guarda estas credenciales en un lugar seguro
   • El usuario solo podrá ver clientes de este gimnasio
   • Puede consultar y registrar asistencias únicamente`

      setSuccess(instrucciones)

      // Limpiar formulario
      setFormData({ nombre: '', email: '', password: '' })

    } catch (error: any) {
      setError(`Error: ${error.message}`)
    } finally {
      setLoading(false)
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
          <div className="bg-blue-100 p-3 rounded-full">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Crear Usuario de Recepción
            </h1>
            <p className="text-gray-600">
              Para: <strong>{gimnasioInfo.nombre}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Generador automático */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🚀 Generar Automáticamente</h3>
        <p className="text-blue-800 mb-4">
          Genera credenciales automáticas para tu gimnasio con un click
        </p>
        <button
          onClick={generarCredenciales}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Generar Credenciales</span>
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={crearCredenciales} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Usuario
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="recepcion@tugimnasio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contraseña segura"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.nombre || !formData.email || !formData.password}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{loading ? 'Generando...' : 'Crear Instrucciones'}</span>
          </button>
        </form>
      </div>

      {/* Resultado */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-900">✅ Instrucciones Generadas</h3>
            <button
              onClick={() => copiarTexto(success, 'instrucciones')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <Copy className="h-4 w-4" />
              <span>{copied === 'instrucciones' ? 'Copiado!' : 'Copiar Todo'}</span>
            </button>
          </div>
          <pre className="text-green-800 text-sm whitespace-pre-wrap bg-white p-4 rounded border overflow-auto max-h-96">
            {success}
          </pre>
        </div>
      )}
    </div>
  )
}