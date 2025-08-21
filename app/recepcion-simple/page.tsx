'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Calendar, CreditCard, CheckCircle, XCircle, Monitor } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface ClienteInfo {
  id: string
  nombre: string
  apellido: string
  documento: string
  telefono: string
  email: string
  activo: boolean
  inscripciones: Array<{
    id: string
    estado: string
    fecha_inicio: string
    fecha_fin: string
    planes: Array<{
      nombre: string
      precio: number
    }>
  }>
  ultima_asistencia?: string
  total_asistencias: number
}

export default function RecepcionSimple() {
  const [busqueda, setBusqueda] = useState('')
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)

  const buscarCliente = async () => {
    if (!busqueda.trim()) {
      setError('Ingresa un documento, nombre o teléfono')
      return
    }

    setLoading(true)
    setError('')
    setClienteInfo(null)

    try {
      // Buscar por documento, nombre, apellido o teléfono
      const { data: clientes, error: searchError } = await supabase
        .from('clientes')
        .select(`
          id,
          nombre,
          apellido,
          documento,
          telefono,
          email,
          activo,
          inscripciones (
            id,
            estado,
            fecha_inicio,
            fecha_fin,
            planes (
              nombre,
              precio
            )
          )
        `)
        .or(`documento.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)

      if (searchError) {
        setError(searchError.message)
        return
      }

      if (!clientes || clientes.length === 0) {
        setError('Cliente no encontrado')
        return
      }

      const cliente = clientes[0]

      // Obtener última asistencia
      const { data: ultimaAsistencia } = await supabase
        .from('asistencias')
        .select('fecha')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      // Contar total de asistencias
      const { count: totalAsistencias } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)

      setClienteInfo({
        ...cliente,
        ultima_asistencia: ultimaAsistencia?.fecha,
        total_asistencias: totalAsistencias || 0,
        inscripciones: cliente.inscripciones.map(inscripcion => ({
          ...inscripcion,
          planes: Array.isArray(inscripcion.planes) ? inscripcion.planes : [inscripcion.planes].filter(Boolean)
        }))
      })

    } catch (error) {
      setError('Error al buscar cliente')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const registrarAsistencia = async () => {
    if (!clienteInfo) return

    setRegistrandoAsistencia(true)
    try {
      const { error } = await supabase
        .from('asistencias')
        .insert({
          cliente_id: clienteInfo.id,
          fecha: getBuenosAiresDateString(),
          hora: getBuenosAiresDate().toTimeString().split(' ')[0]
        })

      if (error) {
        alert('Error registrando asistencia: ' + error.message)
      } else {
        alert('✅ ¡Asistencia registrada exitosamente!')
        // Actualizar info del cliente
        buscarCliente()
      }
    } catch (error) {
      alert('Error inesperado')
    } finally {
      setRegistrandoAsistencia(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarCliente()
    }
  }

  const planActivo = clienteInfo?.inscripciones?.find(
    i => i.estado === 'activa' && new Date(i.fecha_fin) >= getBuenosAiresDate()
  )

  const hoy = getBuenosAiresDate().toLocaleDateString()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">
                Terminal Recepción - {hoy}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Modo Simple - Sin Autenticación</h3>
            <p className="text-yellow-700 text-sm">
              Esta versión simple no tiene filtros de gimnasio. Para uso en producción, usa 
              <a href="/recepcion" className="font-semibold underline ml-1">la versión autenticada</a>.
            </p>
          </div>

          {/* Búsqueda */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🔍 Buscar Cliente
            </h2>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar por documento, nombre o teléfono..."
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={buscarCliente}
                disabled={loading}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-lg font-semibold"
              >
                <Search className="h-6 w-6" />
                <span>{loading ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-lg font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Información del Cliente */}
          {clienteInfo && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <User className="h-8 w-8 mr-3" />
                    {clienteInfo.nombre} {clienteInfo.apellido}
                  </h2>
                  <div className="flex items-center space-x-4">
                    {clienteInfo.activo ? (
                      <span className="flex items-center text-green-600 text-lg font-semibold">
                        <CheckCircle className="h-6 w-6 mr-2" />
                        ACTIVO
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-lg font-semibold">
                        <XCircle className="h-6 w-6 mr-2" />
                        INACTIVO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Datos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">DOCUMENTO</p>
                    <p className="text-2xl font-bold text-gray-900">{clienteInfo.documento}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">TELÉFONO</p>
                    <p className="text-2xl font-bold text-gray-900">{clienteInfo.telefono || 'No registrado'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">VISITAS TOTALES</p>
                    <p className="text-2xl font-bold text-gray-900">{clienteInfo.total_asistencias}</p>
                  </div>
                </div>

                {/* Estado de membresía */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2" />
                    ESTADO DE MEMBRESÍA
                  </h3>
                  
                  {planActivo ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-800">{(Array.isArray(planActivo.planes) ? planActivo.planes[0]?.nombre : planActivo.planes?.nombre) || 'Plan sin nombre'}</p>
                          <p className="text-green-600 text-lg font-medium">
                            Vence: {new Date(planActivo.fecha_fin).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="bg-green-500 text-white px-6 py-3 rounded-full text-lg font-bold">
                          ✅ ACTIVA
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-red-800">SIN MEMBRESÍA ACTIVA</p>
                          <p className="text-red-600 text-lg font-medium">No puede acceder al gimnasio</p>
                        </div>
                        <span className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-bold">
                          ❌ VENCIDA
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Última visita */}
                {clienteInfo.ultima_asistencia && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-lg">
                      <Calendar className="h-5 w-5 inline mr-2" />
                      <strong>Última visita:</strong> {new Date(clienteInfo.ultima_asistencia).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Botón de registro */}
                <div className="pt-4">
                  {planActivo && clienteInfo.activo ? (
                    <button
                      onClick={registrarAsistencia}
                      disabled={registrandoAsistencia}
                      className="w-full bg-green-600 text-white py-6 px-8 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-3 text-xl font-bold"
                    >
                      <CheckCircle className="h-8 w-8" />
                      <span>
                        {registrandoAsistencia ? 'Registrando...' : '✅ REGISTRAR ASISTENCIA'}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full bg-red-100 border-2 border-red-300 rounded-lg p-6 text-center">
                      <p className="text-red-800 text-xl font-bold">
                        ⚠️ NO PUEDE ACCEDER
                      </p>
                      <p className="text-red-600 text-lg">
                        El cliente debe renovar su membresía
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {!clienteInfo && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Instrucciones:</h3>
              <ul className="text-blue-800 space-y-2 text-lg">
                <li>• Ingresa el documento, nombre o teléfono del cliente</li>
                <li>• Presiona Enter o haz clic en "Buscar"</li>
                <li>• Verifica que tenga membresía ACTIVA antes de permitir acceso</li>
                <li>• Solo registra asistencia si el estado es VERDE ✅</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}