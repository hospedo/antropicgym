'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react'

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
    planes: {
      nombre: string
      precio: number
    }
  }>
  ultima_asistencia?: string
  total_asistencias: number
}

export default function RecepcionConsultas() {
  const [busqueda, setBusqueda] = useState('')
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gimnasioId, setGimnasioId] = useState<string>('')

  useEffect(() => {
    const obtenerGimnasioUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Buscar el gimnasio del usuario a través de usuarios_gimnasios
        const { data: usuarioGimnasio } = await supabase
          .from('usuarios_gimnasios')
          .select('gimnasio_id')
          .eq('usuario_id', user.id)
          .single()

        if (usuarioGimnasio) {
          setGimnasioId(usuarioGimnasio.gimnasio_id)
        } else {
          // Si no está en usuarios_gimnasios, buscar en gimnasios directamente (para dueños)
          const { data: gimnasio } = await supabase
            .from('gimnasios')
            .select('id')
            .eq('usuario_id', user.id)
            .single()

          if (gimnasio) {
            setGimnasioId(gimnasio.id)
          }
        }
      } catch (error) {
        console.error('Error obteniendo gimnasio del usuario:', error)
      }
    }

    obtenerGimnasioUsuario()
  }, [])

  const buscarCliente = async () => {
    if (!busqueda.trim()) {
      setError('Ingresa un documento, nombre o teléfono')
      return
    }

    if (!gimnasioId) {
      setError('Usuario sin gimnasio asignado. Contacte al administrador.')
      return
    }

    setLoading(true)
    setError('')
    setClienteInfo(null)

    try {
      // Buscar por documento, nombre, apellido o teléfono EN EL GIMNASIO DEL USUARIO
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
        .eq('gimnasio_id', gimnasioId)
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
        total_asistencias: totalAsistencias || 0
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

    try {
      const { error } = await supabase
        .from('asistencias')
        .insert({
          cliente_id: clienteInfo.id,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0]
        })

      if (error) {
        alert('Error registrando asistencia: ' + error.message)
      } else {
        alert('¡Asistencia registrada exitosamente!')
        // Actualizar info del cliente
        buscarCliente()
      }
    } catch (error) {
      alert('Error inesperado')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarCliente()
    }
  }

  const planActivo = clienteInfo?.inscripciones?.find(
    i => i.estado === 'activa' && new Date(i.fecha_fin) >= new Date()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Consulta de Clientes
        </h1>
        
        {/* Búsqueda */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar por documento, nombre o teléfono..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={buscarCliente}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>{loading ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Información del Cliente */}
      {clienteInfo && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-2" />
                {clienteInfo.nombre} {clienteInfo.apellido}
              </h2>
              <div className="flex items-center space-x-2">
                {clienteInfo.activo ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    Activo
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Documento</p>
                <p className="text-lg font-semibold text-gray-900">{clienteInfo.documento}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono</p>
                <p className="text-lg font-semibold text-gray-900">{clienteInfo.telefono || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{clienteInfo.email || 'No registrado'}</p>
              </div>
            </div>

            {/* Estado de membresía */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Estado de Membresía
              </h3>
              
              {planActivo ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">{planActivo.planes.nombre}</p>
                      <p className="text-green-600 text-sm">
                        Vence: {new Date(planActivo.fecha_fin).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ACTIVA
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-800">Sin membresía activa</p>
                      <p className="text-red-600 text-sm">Debe renovar para acceder</p>
                    </div>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      VENCIDA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Asistencias */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Asistencias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última visita</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {clienteInfo.ultima_asistencia 
                      ? new Date(clienteInfo.ultima_asistencia).toLocaleDateString()
                      : 'Nunca'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de visitas</p>
                  <p className="text-lg font-semibold text-gray-900">{clienteInfo.total_asistencias}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex space-x-4">
              <button
                onClick={registrarAsistencia}
                disabled={!clienteInfo.activo || !planActivo}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Registrar Asistencia</span>
              </button>
              
              {(!clienteInfo.activo || !planActivo) && (
                <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm text-center">
                    ⚠️ Cliente debe renovar membresía para registrar asistencia
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
          <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Ingresa el documento, nombre o teléfono del cliente</li>
            <li>• Presiona Enter o haz clic en "Buscar"</li>
            <li>• Verifica el estado de la membresía antes de permitir el acceso</li>
            <li>• Registra la asistencia si el cliente tiene membresía activa</li>
          </ul>
        </div>
      )}
    </div>
  )
}