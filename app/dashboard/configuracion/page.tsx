'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Gimnasio, Usuario } from '@/types'
import { Save, Building, User, Phone, Mail, MapPin, Clock } from 'lucide-react'

export default function ConfiguracionPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [gimnasio, setGimnasio] = useState<Gimnasio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Usuario
    nombre: '',
    telefono: '',
    
    // Gimnasio
    nombreGimnasio: '',
    direccion: '',
    telefonoGimnasio: '',
    emailGimnasio: '',
    horario_apertura: '',
    horario_cierre: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Cargar datos del usuario
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single()

        // Cargar datos del gimnasio
        const { data: gimnasioData } = await supabase
          .from('gimnasios')
          .select('*')
          .eq('usuario_id', user.id)
          .single()

        setUsuario(usuarioData)
        setGimnasio(gimnasioData)

        // Llenar formulario
        setFormData({
          nombre: usuarioData?.nombre || '',
          telefono: usuarioData?.telefono || '',
          nombreGimnasio: gimnasioData?.nombre || '',
          direccion: gimnasioData?.direccion || '',
          telefonoGimnasio: gimnasioData?.telefono || '',
          emailGimnasio: gimnasioData?.email || user.email || '',
          horario_apertura: gimnasioData?.horario_apertura || '06:00',
          horario_cierre: gimnasioData?.horario_cierre || '22:00'
        })

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      // Actualizar usuario
      const { error: userError } = await supabase
        .from('usuarios')
        .upsert({
          id: user.id,
          email: user.email!,
          nombre: formData.nombre,
          telefono: formData.telefono
        })

      if (userError) throw userError

      // Actualizar o crear gimnasio
      const { error: gymError } = await supabase
        .from('gimnasios')
        .upsert({
          usuario_id: user.id,
          nombre: formData.nombreGimnasio,
          direccion: formData.direccion,
          telefono: formData.telefonoGimnasio,
          email: formData.emailGimnasio,
          horario_apertura: formData.horario_apertura,
          horario_cierre: formData.horario_cierre
        })

      if (gymError) throw gymError

      setMessage('✅ Configuración guardada correctamente')
      
      // Recargar datos
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona la información de tu perfil y gimnasio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Información Personal */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="mr-2 h-5 w-5" />
            Información Personal
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono Personal
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="+34 600 000 000"
              />
            </div>
          </div>
        </div>

        {/* Información del Gimnasio */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Información del Gimnasio
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="nombreGimnasio" className="block text-sm font-medium text-gray-700">
                Nombre del Gimnasio *
              </label>
              <input
                type="text"
                id="nombreGimnasio"
                name="nombreGimnasio"
                value={formData.nombreGimnasio}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Fitness Center Pro"
              />
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle Principal 123, Ciudad"
              />
            </div>

            <div>
              <label htmlFor="telefonoGimnasio" className="block text-sm font-medium text-gray-700">
                Teléfono del Gimnasio
              </label>
              <input
                type="tel"
                id="telefonoGimnasio"
                name="telefonoGimnasio"
                value={formData.telefonoGimnasio}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="+34 900 000 000"
              />
            </div>

            <div>
              <label htmlFor="emailGimnasio" className="block text-sm font-medium text-gray-700">
                Email del Gimnasio
              </label>
              <input
                type="email"
                id="emailGimnasio"
                name="emailGimnasio"
                value={formData.emailGimnasio}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="info@gimnasio.com"
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Horarios de Operación
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="horario_apertura" className="block text-sm font-medium text-gray-700">
                Hora de Apertura
              </label>
              <input
                type="time"
                id="horario_apertura"
                name="horario_apertura"
                value={formData.horario_apertura}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="horario_cierre" className="block text-sm font-medium text-gray-700">
                Hora de Cierre
              </label>
              <input
                type="time"
                id="horario_cierre"
                name="horario_cierre"
                value={formData.horario_cierre}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{message}</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Información importante:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los campos marcados con * son obligatorios</li>
          <li>• Esta información se usará en reportes y comunicaciones</li>
          <li>• Puedes actualizar estos datos en cualquier momento</li>
        </ul>
      </div>
    </div>
  )
}