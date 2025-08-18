'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, Link, Copy, CheckCircle, RefreshCw, ExternalLink, QrCode } from 'lucide-react'

interface GimnasioInfo {
  id: string
  nombre: string
  access_token?: string
}

export default function CrearAccesoRecepcion() {
  const [gimnasioInfo, setGimnasioInfo] = useState<GimnasioInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const obtenerGimnasio = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id, nombre, access_token')
        .eq('usuario_id', user.id)
        .single()

      if (gimnasio) {
        setGimnasioInfo(gimnasio)
      }
    }

    obtenerGimnasio()
  }, [])

  const generarToken = async () => {
    if (!gimnasioInfo) return

    setLoading(true)
    setError('')

    try {
      // Generar token único seguro
      const token = `gym_${gimnasioInfo.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Actualizar el gimnasio con el nuevo token
      const { error } = await supabase
        .from('gimnasios')
        .update({ access_token: token })
        .eq('id', gimnasioInfo.id)

      if (error) {
        setError('Error generando token de acceso')
        return
      }

      // Actualizar estado local
      setGimnasioInfo(prev => prev ? { ...prev, access_token: token } : null)

    } catch (error) {
      setError('Error inesperado generando token')
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

  const getReceptionUrl = () => {
    if (!gimnasioInfo?.access_token) return ''
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    return `${baseUrl}/recepcion-token?token=${gimnasioInfo.access_token}`
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
          <div className="bg-purple-100 p-3 rounded-full">
            <Monitor className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🔗 Acceso Genérico de Recepción
            </h1>
            <p className="text-gray-600">
              Para: <strong>{gimnasioInfo.nombre}</strong>
            </p>
            <p className="text-sm text-purple-600 font-medium">
              ✨ Un solo enlace para toda la recepción - Sin usuarios ni contraseñas
            </p>
          </div>
        </div>
      </div>

      {/* Información del concepto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 ¿Cómo funciona?</h3>
        <ul className="text-blue-800 space-y-2">
          <li>• 🔗 <strong>Un solo enlace especial</strong> para tu gimnasio</li>
          <li>• 🚫 <strong>Sin usuarios ni contraseñas</strong> - Acceso directo</li>
          <li>• 🏢 <strong>Solo tus clientes</strong> - Automáticamente filtrado por tu gimnasio</li>
          <li>• 💻 <strong>Cualquier dispositivo</strong> - Computadora, tablet, celular</li>
          <li>• 🔄 <strong>Token renovable</strong> - Puedes cambiar el enlace cuando quieras</li>
        </ul>
      </div>

      {/* Generar/Mostrar Token */}
      {!gimnasioInfo.access_token ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <Link className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generar Enlace de Acceso
            </h3>
            <p className="text-gray-600 mb-6">
              Crea un enlace único y seguro para el acceso de recepción
            </p>
            <button
              onClick={generarToken}
              disabled={loading}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 mx-auto text-lg font-semibold"
            >
              <Link className="h-6 w-6" />
              <span>{loading ? 'Generando...' : 'Generar Enlace Único'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              🔗 Enlace de Recepción Activo
            </h3>
            <button
              onClick={generarToken}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Renovar</span>
            </button>
          </div>

          {/* URL Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm text-gray-600 mb-1">URL de Acceso:</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {getReceptionUrl()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copiarTexto(getReceptionUrl(), 'url')}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied === 'url' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={() => window.open(getReceptionUrl(), '_blank')}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Probar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instrucciones de uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Para la computadora de recepción */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">💻 Para la Computadora de Recepción</h4>
              <ol className="text-green-800 text-sm space-y-2">
                <li>1. <strong>Copia el enlace</strong> de arriba</li>
                <li>2. <strong>Ábrelo en el navegador</strong> de la computadora de recepción</li>
                <li>3. <strong>Agrega a favoritos</strong> para acceso rápido</li>
                <li>4. <strong>¡Listo!</strong> - Pueden consultar clientes y registrar asistencias</li>
              </ol>
            </div>

            {/* Para dispositivos móviles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">📱 Para Dispositivos Móviles</h4>
              <ol className="text-blue-800 text-sm space-y-2">
                <li>1. <strong>Envía el enlace</strong> por WhatsApp/Email</li>
                <li>2. <strong>Ábrelo en el celular/tablet</strong></li>
                <li>3. <strong>Agrega a pantalla inicio</strong> como app</li>
                <li>4. <strong>Funciona offline</strong> una vez cargado</li>
              </ol>
            </div>
          </div>

          {/* Código QR (próximamente) */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              <strong>Próximamente:</strong> Código QR para acceso rápido desde móviles
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Ventajas */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">✨ Ventajas del Acceso Genérico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">🚀 Simplicidad</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Sin usuarios que crear</li>
              <li>• Sin contraseñas que recordar</li>
              <li>• Un solo enlace para todos</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">🔒 Seguridad</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Token único por gimnasio</li>
              <li>• Solo accede a tus clientes</li>
              <li>• Renovable cuando quieras</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">💼 Operacional</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Cualquier empleado puede usar</li>
              <li>• Funciona en cualquier dispositivo</li>
              <li>• No requiere capacitación</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">🔄 Mantenimiento</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Cero configuración técnica</li>
              <li>• Token renovable al instante</li>
              <li>• Sin dependencia de IT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}