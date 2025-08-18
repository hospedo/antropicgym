'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, User, Key, Save, Eye, EyeOff, Trash2 } from 'lucide-react'

interface GimnasioInfo {
  id: string
  nombre: string
  recepcionista_1_nombre?: string
  recepcionista_1_password?: string
  recepcionista_2_nombre?: string
  recepcionista_2_password?: string
  recepcionista_3_nombre?: string
  recepcionista_3_password?: string
  recepcionista_4_nombre?: string
  recepcionista_4_password?: string
}

interface Recepcionista {
  nombre: string
  password: string
}

export default function ConfigurarRecepcionistas() {
  const [gimnasioInfo, setGimnasioInfo] = useState<GimnasioInfo | null>(null)
  const [recepcionistas, setRecepcionistas] = useState<Recepcionista[]>([
    { nombre: '', password: '' },
    { nombre: '', password: '' },
    { nombre: '', password: '' },
    { nombre: '', password: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswords, setShowPasswords] = useState([false, false, false, false])

  useEffect(() => {
    const obtenerGimnasio = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select(`
          id, 
          nombre,
          recepcionista_1_nombre,
          recepcionista_1_password,
          recepcionista_2_nombre,
          recepcionista_2_password,
          recepcionista_3_nombre,
          recepcionista_3_password,
          recepcionista_4_nombre,
          recepcionista_4_password
        `)
        .eq('usuario_id', user.id)
        .single()

      if (gimnasio) {
        setGimnasioInfo(gimnasio)
        
        // Cargar datos existentes
        setRecepcionistas([
          { 
            nombre: gimnasio.recepcionista_1_nombre || '', 
            password: gimnasio.recepcionista_1_password || '' 
          },
          { 
            nombre: gimnasio.recepcionista_2_nombre || '', 
            password: gimnasio.recepcionista_2_password || '' 
          },
          { 
            nombre: gimnasio.recepcionista_3_nombre || '', 
            password: gimnasio.recepcionista_3_password || '' 
          },
          { 
            nombre: gimnasio.recepcionista_4_nombre || '', 
            password: gimnasio.recepcionista_4_password || '' 
          }
        ])
      }
    }

    obtenerGimnasio()
  }, [])

  const actualizarRecepcionista = (index: number, field: 'nombre' | 'password', value: string) => {
    setRecepcionistas(prev => {
      const nuevos = [...prev]
      nuevos[index][field] = value
      return nuevos
    })
  }

  const generarPassword = (index: number) => {
    const password = Math.random().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 100)
    actualizarRecepcionista(index, 'password', password)
  }

  const limpiarRecepcionista = (index: number) => {
    actualizarRecepcionista(index, 'nombre', '')
    actualizarRecepcionista(index, 'password', '')
  }

  const toggleShowPassword = (index: number) => {
    setShowPasswords(prev => {
      const nuevos = [...prev]
      nuevos[index] = !nuevos[index]
      return nuevos
    })
  }

  const guardarRecepcionistas = async () => {
    if (!gimnasioInfo) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updateData: any = {}
      
      recepcionistas.forEach((recep, index) => {
        const num = index + 1
        updateData[`recepcionista_${num}_nombre`] = recep.nombre || null
        updateData[`recepcionista_${num}_password`] = recep.password || null
      })

      const { error } = await supabase
        .from('gimnasios')
        .update(updateData)
        .eq('id', gimnasioInfo.id)

      if (error) {
        setError('Error guardando recepcionistas: ' + error.message)
        return
      }

      setSuccess('✅ Recepcionistas configurados exitosamente')
      
      // Actualizar estado local
      setGimnasioInfo(prev => prev ? { ...prev, ...updateData } : null)

    } catch (error: any) {
      setError('Error inesperado: ' + error.message)
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
          <div className="bg-indigo-100 p-3 rounded-full">
            <Monitor className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              👥 Configurar Recepcionistas
            </h1>
            <p className="text-gray-600">
              Para: <strong>{gimnasioInfo.nombre}</strong>
            </p>
            <p className="text-sm text-indigo-600 font-medium">
              Configura hasta 4 recepcionistas con códigos de autorización
            </p>
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">ℹ️ ¿Cómo funciona?</h3>
        <ul className="text-blue-800 space-y-2">
          <li>• 👤 <strong>Cada recepcionista</strong> tiene su nombre y código único</li>
          <li>• 🔐 <strong>Código de autorización</strong> - Solo para renovar membresías</li>
          <li>• 📊 <strong>Tracking completo</strong> - Cada acción queda registrada con el nombre</li>
          <li>• 🏢 <strong>Consultas abiertas</strong> - Búsqueda de clientes sin código</li>
          <li>• 💳 <strong>Renovaciones protegidas</strong> - Requieren autorización específica</li>
        </ul>
      </div>

      {/* Formulario de recepcionistas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Configurar Recepcionistas</h3>
        
        <div className="space-y-6">
          {recepcionistas.map((recep, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Recepcionista #{index + 1}
                </h4>
                {(recep.nombre || recep.password) && (
                  <button
                    onClick={() => limpiarRecepcionista(index)}
                    className="text-red-600 hover:text-red-800"
                    title="Limpiar datos"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Recepcionista
                  </label>
                  <input
                    type="text"
                    value={recep.nombre}
                    onChange={(e) => actualizarRecepcionista(index, 'nombre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: María González"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Autorización
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPasswords[index] ? 'text' : 'password'}
                        value={recep.password}
                        onChange={(e) => actualizarRecepcionista(index, 'password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Código único"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowPassword(index)}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => generarPassword(index)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-1"
                    >
                      <Key className="h-4 w-4" />
                      <span>Generar</span>
                    </button>
                  </div>
                </div>
              </div>

              {recep.nombre && recep.password && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">
                    ✅ <strong>{recep.nombre}</strong> puede autorizar renovaciones con código: <code className="bg-white px-1 rounded">{recep.password}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Botón guardar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={guardarRecepcionistas}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 font-semibold"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Instrucciones de Uso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">👀 Para Consultas (Sin código)</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Buscar clientes por documento/nombre</li>
              <li>• Ver estado de membresía</li>
              <li>• Registrar asistencias</li>
              <li>• Ver historial de visitas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔐 Para Renovaciones (Con código)</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Renovar membresías vencidas</li>
              <li>• Extender planes activos</li>
              <li>• Cambiar tipo de plan</li>
              <li>• Queda registrado quién lo hizo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}