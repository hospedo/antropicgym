'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Calendar, CreditCard, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString } from '@/lib/timezone-utils'
import { formatDateSafe, formatInputDate } from '@/lib/date-utils'
import DateInputArgentine from '@/components/DateInputArgentine'

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
    plan_id: string
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
  asistencias_periodo_actual: number
}

export default function ConsultasPage() {
  const [busqueda, setBusqueda] = useState('')
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gimnasioId, setGimnasioId] = useState<string>('')
  
  // Estados para modal de asignación de plan
  const [planesDisponibles, setPlanesDisponibles] = useState<any[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [assigningPlan, setAssigningPlan] = useState(false)
  const [fechaInicioPlan, setFechaInicioPlan] = useState('')
  
  // Estados para modal de modificar fecha
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [modifyingPlan, setModifyingPlan] = useState(false)
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('')

  // Función para convertir fecha a formato YYYY-MM-DD para input date
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const obtenerGimnasioUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Buscar gimnasio del usuario directamente
        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (gimnasio) {
          setGimnasioId(gimnasio.id)
        }
      } catch (error) {
        console.error('Error obteniendo gimnasio del usuario:', error)
      }
    }

    obtenerGimnasioUsuario()
  }, [])

  const cargarPlanes = async () => {
    if (!gimnasioId) return
    
    try {
      const { data: planesData } = await supabase
        .from('planes')
        .select('*')
        .eq('gimnasio_id', gimnasioId)
        .eq('activo', true)
        .order('nombre')

      setPlanesDisponibles(planesData || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

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
            plan_id,
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

      // Consulta directa a inscripciones como respaldo
      const { data: inscripcionesDirectas, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select(`
          id,
          plan_id,
          estado,
          fecha_inicio,
          fecha_fin,
          planes (
            nombre,
            precio
          )
        `)
        .eq('cliente_id', cliente.id)

      console.log('Cliente encontrado:', cliente)
      console.log('Inscripciones desde relación:', cliente.inscripciones)
      console.log('Inscripciones consulta directa:', inscripcionesDirectas, inscripcionesError)

      // Contar total de asistencias (histórico)
      const { count: totalAsistencias } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)

      // Contar asistencias del período actual de membresía
      let asistenciasPeriodoActual = 0
      const inscripcionActiva = (inscripcionesDirectas || cliente.inscripciones || []).find(
        i => i.estado === 'activa' && new Date(i.fecha_fin + 'T23:59:59') >= new Date()
      )
      
      if (inscripcionActiva) {
        const { count: asistenciasPeriodo } = await supabase
          .from('asistencias')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id)
          .gte('fecha', inscripcionActiva.fecha_inicio)
          .lte('fecha', inscripcionActiva.fecha_fin)
        
        asistenciasPeriodoActual = asistenciasPeriodo || 0
      }

      setClienteInfo({
        ...cliente,
        ultima_asistencia: ultimaAsistencia?.fecha,
        total_asistencias: totalAsistencias || 0,
        asistencias_periodo_actual: asistenciasPeriodoActual,
        inscripciones: (inscripcionesDirectas || cliente.inscripciones || []).map(inscripcion => ({
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

  const asignarPlan = async (planId: string) => {
    if (!clienteInfo) return
    if (!fechaInicioPlan) {
      alert('⚠️ Selecciona la fecha de inicio del plan')
      return
    }

    // Verificar si hay planes activos
    const planesActivosActuales = clienteInfo.inscripciones?.filter(
      i => {
        const fechaFin = new Date(i.fecha_fin + 'T23:59:59')
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        return i.estado === 'activa' && fechaFin >= hoy
      }
    ) || []

    if (planesActivosActuales.length > 0) {
      const confirmacion = confirm(
        `⚠️ Este cliente ya tiene ${planesActivosActuales.length} membresía(s) activa(s).\n\n¿Quieres continuar agregando otra membresía? Esto puede crear confusión.\n\nSe recomienda eliminar o modificar las membresías existentes primero.`
      )
      if (!confirmacion) return
    }

    setAssigningPlan(true)

    try {
      const plan = planesDisponibles.find(p => p.id === planId)
      if (!plan) {
        alert('Plan no encontrado')
        return
      }

      // Crear fecha desde string YYYY-MM-DD
      const [year, month, day] = fechaInicioPlan.split('-').map(Number)
      const fechaInicio = new Date(year, month - 1, day) // month - 1 porque Date usa índice 0
      const fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setDate(fechaInicio.getDate() + plan.duracion_dias)

      // Cambiar inscripciones anteriores a 'vencida' para mantener historial
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ estado: 'vencida' })
        .eq('cliente_id', clienteInfo.id)
        .eq('estado', 'activa')

      if (updateError) {
        console.warn('Warning updating previous inscriptions:', updateError)
        // Continuar aunque falle la actualización de inscripciones anteriores
      }

      // Insertar nueva inscripción
      const { error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert({
          cliente_id: clienteInfo.id,
          plan_id: planId,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaVencimiento.toISOString().split('T')[0],
          estado: 'activa',
          monto_pagado: plan.precio
        })

      if (inscripcionError) throw inscripcionError

      setShowPlanModal(false)
      alert(`✅ Plan "${plan.nombre}" asignado correctamente`)
      
      // Recargar información del cliente
      buscarCliente()

    } catch (error: any) {
      console.error('Error asignando plan:', error)
      alert('Error al asignar el plan: ' + error.message)
    } finally {
      setAssigningPlan(false)
    }
  }

  const modificarFechaPlan = async () => {
    if (!clienteInfo || !nuevaFechaInicio) {
      alert('⚠️ Selecciona la nueva fecha de inicio')
      return
    }

    const planActivo = clienteInfo.inscripciones?.find(
      i => {
        const fechaFin = new Date(i.fecha_fin + 'T23:59:59')
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        return i.estado === 'activa' && fechaFin >= hoy
      }
    )

    if (!planActivo) {
      alert('No hay plan activo para modificar')
      return
    }

    setModifyingPlan(true)

    try {
      // Crear nueva fecha desde string YYYY-MM-DD
      const [year, month, day] = nuevaFechaInicio.split('-').map(Number)
      const nuevaFechaInicioDate = new Date(year, month - 1, day)
      
      // Calcular nueva fecha de vencimiento basada en el plan actual
      const planOriginal = Array.isArray(planActivo.planes) ? planActivo.planes[0] : planActivo.planes
      
      if (!planActivo.plan_id) {
        alert('Error: No se pudo obtener el ID del plan')
        return
      }

      // Obtener duración del plan desde la base de datos
      const { data: planData } = await supabase
        .from('planes')
        .select('duracion_dias')
        .eq('id', planActivo.plan_id)
        .single()

      if (!planData) {
        alert('Error: No se pudo obtener información del plan')
        return
      }

      const nuevaFechaVencimiento = new Date(nuevaFechaInicioDate)
      nuevaFechaVencimiento.setDate(nuevaFechaInicioDate.getDate() + planData.duracion_dias)

      // Actualizar la inscripción existente
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({
          fecha_inicio: nuevaFechaInicioDate.toISOString(),
          fecha_fin: nuevaFechaVencimiento.toISOString()
        })
        .eq('id', planActivo.id)

      if (updateError) throw updateError

      setShowModifyModal(false)
      alert(`✅ Fecha del plan actualizada correctamente`)
      
      // Recargar información del cliente
      buscarCliente()

    } catch (error: any) {
      console.error('Error modificando fecha del plan:', error)
      alert('Error al modificar la fecha: ' + error.message)
    } finally {
      setModifyingPlan(false)
    }
  }

  const eliminarInscripcion = async (inscripcionId: string) => {
    if (!clienteInfo) return
    
    const confirmacion = confirm('¿Estás seguro de que quieres eliminar esta membresía? Esta acción no se puede deshacer.')
    if (!confirmacion) return
    
    try {
      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId)
        
      if (error) throw error
      
      alert('✅ Membresía eliminada correctamente')
      // Recargar información del cliente
      buscarCliente()
    } catch (error: any) {
      console.error('Error eliminando inscripción:', error)
      alert('Error al eliminar la membresía: ' + error.message)
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

  const planesActivos = clienteInfo?.inscripciones?.filter(
    i => {
      const fechaFin = new Date(i.fecha_fin + 'T23:59:59') // Asegurar que sea fin del día
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0) // Inicio del día actual
      console.log('Verificando inscripción:', i.estado, i.fecha_fin, fechaFin, hoy, fechaFin >= hoy)
      return i.estado === 'activa' && fechaFin >= hoy
    }
  ) || []
  
  const planActivo = planesActivos[0] // Para compatibilidad con código existente
  
  // Determinar si el cliente realmente está activo (basado en planes, no en el campo DB)
  const clienteRealmenteActivo = !!planActivo

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          🔐 Control de Acceso
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
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="h-7 w-7 mr-2" />
                {clienteInfo.nombre} {clienteInfo.apellido}
              </h2>
              <div className="flex items-center space-x-2">
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
              
              {planesActivos.length > 0 ? (
                <div className="space-y-3">
                  {planesActivos.map((plan, index) => (
                    <div key={plan.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">
                            {(Array.isArray(plan.planes) ? plan.planes[0]?.nombre : plan.planes?.nombre) || 'Plan sin nombre'}
                          </p>
                          <p className="text-green-600 text-sm">
                            Inicio: {new Date(plan.fecha_inicio).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })} - Vence: {new Date(plan.fecha_fin).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ACTIVA
                          </span>
                          <button
                            onClick={() => {
                              setNuevaFechaInicio(plan.fecha_inicio.split('T')[0])
                              setShowModifyModal(true)
                            }}
                            className="bg-orange-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-orange-700 flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Modificar</span>
                          </button>
                          {planesActivos.length > 1 && (
                            <button
                              onClick={() => eliminarInscripcion(plan.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-red-700 flex items-center space-x-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {planesActivos.length > 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-700 text-sm">
                        ⚠️ Este cliente tiene múltiples membresías activas. Considera eliminar las que no correspondan.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-800">Sin membresía activa</p>
                      <p className="text-red-600 text-sm">Debe renovar para acceder</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        VENCIDA
                      </span>
                      <button
                        onClick={() => {
                          cargarPlanes()
                          setFechaInicioPlan(getBuenosAiresDateString())
                          setShowPlanModal(true)
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Asignar Plan</span>
                      </button>
                    </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última visita</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {clienteInfo.ultima_asistencia 
                      ? new Date(clienteInfo.ultima_asistencia).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Nunca'
                    }
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">
                    {planActivo ? 'Visitas en membresía actual' : 'Visitas en membresía anterior'}
                  </p>
                  <p className="text-xl font-bold text-blue-900">{clienteInfo.asistencias_periodo_actual}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total visitas (historial)</p>
                  <p className="text-lg font-semibold text-gray-900">{clienteInfo.total_asistencias}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex space-x-4">
              <button
                onClick={registrarAsistencia}
                disabled={!planActivo}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Registrar Asistencia</span>
              </button>
              
              {!planActivo && (
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

      {/* Modal para seleccionar plan */}
      {showPlanModal && clienteInfo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Seleccionar Plan para {clienteInfo.nombre} {clienteInfo.apellido}
              </h3>
              
              {/* Campo de fecha */}
              <div className="mb-6">
                <label htmlFor="fechaInicioPlan" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio del plan:
                </label>
                <DateInputArgentine
                  id="fechaInicioPlan"
                  value={fechaInicioPlan}
                  onChange={setFechaInicioPlan}
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
                {fechaInicioPlan && (
                  <div className="text-sm text-blue-600 font-medium mt-2">
                    📅 Fecha seleccionada: {formatInputDate(fechaInicioPlan)}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  💡 Ajusta la fecha si el cliente pagó en otra fecha
                </p>
              </div>

              {/* Lista de planes */}
              {planesDisponibles.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {planesDisponibles.map((plan) => (
                    <div
                      key={plan.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{plan.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            ${plan.precio} • {plan.duracion_dias} días
                          </p>
                          {fechaInicioPlan && (
                            <p className="text-xs text-blue-600 mt-1">
                              Vence: {(() => {
                                // Crear fecha desde string YYYY-MM-DD
                                const [year, month, day] = fechaInicioPlan.split('-').map(Number)
                                const inicio = new Date(year, month - 1, day) // month - 1 porque Date usa índice 0
                                const vencimiento = new Date(inicio)
                                vencimiento.setDate(inicio.getDate() + plan.duracion_dias)
                                return formatDateSafe(vencimiento)
                              })()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => asignarPlan(plan.id)}
                          disabled={assigningPlan || !fechaInicioPlan}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {assigningPlan ? 'Asignando...' : 'Seleccionar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No hay planes disponibles</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para modificar fecha del plan */}
      {showModifyModal && clienteInfo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Modificar Fecha del Plan de {clienteInfo.nombre} {clienteInfo.apellido}
              </h3>
              
              {/* Campo de nueva fecha */}
              <div className="mb-6">
                <label htmlFor="nuevaFechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva fecha de inicio del plan:
                </label>
                <DateInputArgentine
                  id="nuevaFechaInicio"
                  value={nuevaFechaInicio}
                  onChange={setNuevaFechaInicio}
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
                {nuevaFechaInicio && (
                  <div className="text-sm text-orange-600 font-medium mt-2">
                    📅 Nueva fecha: {formatInputDate(nuevaFechaInicio)}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  💡 La fecha de vencimiento se recalculará automáticamente
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModifyModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={modificarFechaPlan}
                  disabled={!nuevaFechaInicio || modifyingPlan}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {modifyingPlan ? 'Modificando...' : 'Modificar Fecha'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}