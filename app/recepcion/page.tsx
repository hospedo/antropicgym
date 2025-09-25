'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react'
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

export default function RecepcionConsultas() {
  const [busqueda, setBusqueda] = useState('')
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gimnasioId, setGimnasioId] = useState<string>('')
  const [mostrarRenovacion, setMostrarRenovacion] = useState(false)
  const [planes, setPlanes] = useState<any[]>([])
  const [planSeleccionado, setPlanSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [renovando, setRenovando] = useState(false)

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
          
          // Cargar planes del gimnasio
          const { data: planesData } = await supabase
            .from('planes')
            .select('*')
            .eq('gimnasio_id', usuarioGimnasio.gimnasio_id)
            .eq('activo', true)
          
          if (planesData) {
            setPlanes(planesData)
          }
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
      // Primero obtener todos los clientes del gimnasio
      const { data: todosClientes, error: searchError } = await supabase
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

      if (searchError) {
        setError(searchError.message)
        return
      }

      // Filtrar en el cliente para permitir búsqueda por nombre completo
      const busquedaLower = busqueda.toLowerCase().trim()
      const palabrasBusqueda = busquedaLower.split(/\s+/).filter(p => p.length > 0)
      
      const clientes = todosClientes?.filter(cliente => {
        const documento = cliente.documento?.toLowerCase() || ''
        const nombre = cliente.nombre?.toLowerCase() || ''
        const apellido = cliente.apellido?.toLowerCase() || ''
        const telefono = cliente.telefono || ''
        const nombreCompleto = `${nombre} ${apellido}`.trim()
        
        // Buscar por campos individuales
        if (documento.includes(busquedaLower) ||
            nombre.includes(busquedaLower) ||
            apellido.includes(busquedaLower) ||
            telefono.includes(busquedaLower)) {
          return true
        }
        
        // Buscar por nombre completo (coincidencia exacta)
        if (nombreCompleto.includes(busquedaLower)) {
          return true
        }
        
        // Buscar que todas las palabras estén en el nombre completo
        if (palabrasBusqueda.length > 1) {
          return palabrasBusqueda.every(palabra => nombreCompleto.includes(palabra))
        }
        
        return false
      }) || []

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
    i => i.estado === 'activa' && new Date(i.fecha_fin) >= getBuenosAiresDate()
  )

  // Calcular días para renovar
  const calcularDiasParaRenovar = () => {
    if (!clienteInfo?.inscripciones?.length) return null
    
    // Buscar la inscripción más reciente (activa o vencida)
    const inscripcionMasReciente = clienteInfo.inscripciones
      .sort((a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())[0]
    
    if (!inscripcionMasReciente?.fecha_fin) return null
    
    try {
      const fechaFin = new Date(inscripcionMasReciente.fecha_fin)
      const hoy = getBuenosAiresDate()
      
      // Si la fecha es inválida, retornar null
      if (isNaN(fechaFin.getTime())) return null
      
      const diffTiempo = fechaFin.getTime() - hoy.getTime()
      const diffDias = Math.ceil(diffTiempo / (1000 * 3600 * 24))
      
      return diffDias
    } catch {
      return null
    }
  }

  const diasParaRenovar = calcularDiasParaRenovar()
  
  // Determinar si el cliente realmente está activo (basado en planes, no en el campo DB)
  const clienteRealmenteActivo = !!planActivo

  const renovarPlan = async () => {
    if (!planSeleccionado || !fechaInicio || !clienteInfo) {
      setError('Por favor completa todos los campos')
      return
    }

    setRenovando(true)
    setError('')

    try {
      const planElegido = planes.find(p => p.id === planSeleccionado)
      if (!planElegido) {
        setError('Plan no encontrado')
        return
      }

      const fechaInicioDate = new Date(fechaInicio)
      const fechaFinDate = new Date(fechaInicioDate)
      fechaFinDate.setDate(fechaInicioDate.getDate() + planElegido.duracion_dias)

      // Crear nueva inscripción
      const { error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert({
          cliente_id: clienteInfo.id,
          plan_id: planSeleccionado,
          fecha_inicio: fechaInicioDate.toISOString().split('T')[0],
          fecha_fin: fechaFinDate.toISOString().split('T')[0],
          estado: 'activa',
          monto_pagado: planElegido.precio
        })

      if (inscripcionError) throw inscripcionError

      // Actualizar estado del cliente a activo
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({ activo: true })
        .eq('id', clienteInfo.id)

      if (clienteError) throw clienteError

      // Refrescar información del cliente
      await buscarCliente()
      
      setMostrarRenovacion(false)
      setPlanSeleccionado('')
      setFechaInicio('')
      alert('Plan renovado exitosamente!')

    } catch (err: any) {
      setError(err.message || 'Error al renovar el plan')
    } finally {
      setRenovando(false)
    }
  }

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
              className="w-full px-4 py-4 border border-gray-300 rounded-lg text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={buscarCliente}
            disabled={loading}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-lg font-semibold"
          >
            <Search className="h-6 w-6" />
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <User className="h-7 w-7 mr-2" />
                  {clienteInfo.nombre} {clienteInfo.apellido}
                </h2>
                {/* Mostrar días para renovar */}
                {diasParaRenovar !== null && (
                  <p className={`text-sm font-medium mt-1 ${
                    diasParaRenovar > 0 
                      ? 'text-blue-600' 
                      : diasParaRenovar === 0
                      ? 'text-orange-600'
                      : 'text-red-600'
                  }`}>
                    {diasParaRenovar > 0 
                      ? `${diasParaRenovar} días para renovar`
                      : diasParaRenovar === 0
                      ? 'Vence hoy'
                      : `Vencido hace ${Math.abs(diasParaRenovar)} días`
                    }
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!clienteRealmenteActivo && (
                  <button
                    onClick={() => {
                      // Establecer fecha de inicio por defecto basada en el plan vencido
                      const inscripcionMasReciente = clienteInfo.inscripciones
                        ?.sort((a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())[0]
                      
                      if (inscripcionMasReciente?.fecha_fin) {
                        try {
                          const fechaVencimiento = new Date(inscripcionMasReciente.fecha_fin)
                          if (!isNaN(fechaVencimiento.getTime())) {
                            // Comenzar desde el día después del vencimiento
                            fechaVencimiento.setDate(fechaVencimiento.getDate() + 1)
                            setFechaInicio(fechaVencimiento.toISOString().split('T')[0])
                          } else {
                            setFechaInicio(getBuenosAiresDateString())
                          }
                        } catch {
                          setFechaInicio(getBuenosAiresDateString())
                        }
                      } else {
                        setFechaInicio(getBuenosAiresDateString())
                      }
                      
                      setMostrarRenovacion(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Renovar
                  </button>
                )}
                {clienteRealmenteActivo ? (
                  <span className="flex items-center text-green-600 text-lg font-bold">
                    <CheckCircle className="h-6 w-6 mr-1" />
                    Activo
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 text-lg font-bold">
                    <XCircle className="h-6 w-6 mr-1" />
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Documento</p>
                <p className="text-2xl font-bold text-blue-900">{clienteInfo.documento}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Teléfono</p>
                <p className="text-lg font-semibold text-gray-900">{clienteInfo.telefono || 'No registrado'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{clienteInfo.email || 'No registrado'}</p>
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
                      <p className="font-medium text-green-800">{(Array.isArray(planActivo.planes) ? planActivo.planes[0]?.nombre : planActivo.planes?.nombre) || 'Plan sin nombre'}</p>
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
                disabled={!clienteRealmenteActivo || !planActivo}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Registrar Asistencia</span>
              </button>
              
              {(!clienteRealmenteActivo || !planActivo) && (
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

      {/* Modal de Renovación */}
      {mostrarRenovacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Renovar Plan - {clienteInfo?.nombre} {clienteInfo?.apellido}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio:
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar plan:
                </label>
                <select
                  value={planSeleccionado}
                  onChange={(e) => setPlanSeleccionado(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecciona un plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio} ({plan.duracion_dias} días)
                    </option>
                  ))}
                </select>
              </div>

              {planSeleccionado && fechaInicio && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Vigencia:</strong> {fechaInicio} al{' '}
                    {(() => {
                      const plan = planes.find(p => p.id === planSeleccionado)
                      if (plan && fechaInicio) {
                        const inicio = new Date(fechaInicio)
                        const fin = new Date(inicio)
                        fin.setDate(inicio.getDate() + plan.duracion_dias)
                        return fin.toISOString().split('T')[0]
                      }
                      return 'Selecciona un plan'
                    })()}
                  </p>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setMostrarRenovacion(false)
                  setPlanSeleccionado('')
                  setFechaInicio('')
                  setError('')
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={renovarPlan}
                disabled={!planSeleccionado || !fechaInicio || renovando}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {renovando ? 'Renovando...' : 'Renovar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}