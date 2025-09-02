'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuditLogger } from '@/lib/audit-logger'
import { Search, User, Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, Plus, RefreshCw, UserCheck, Edit } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface ConsultaResult {
  cliente: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono: string
    documento: string
  }
  inscripcion_activa: {
    id: string
    fecha_inicio: string
    fecha_fin: string
    estado: string
    plan: {
      nombre: string
      precio: number
      duracion_dias: number
    }
  } | null
  dias_restantes: number
  estado_membresia: 'activa' | 'por_vencer' | 'vencida' | 'sin_plan'
  ultima_asistencia: string | null
  total_asistencias_mes: number
}

interface Plan {
  id: string
  nombre: string
  precio: number
  duracion_dias: number
}

export default function ConsultasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'nombre' | 'documento' | 'telefono'>('documento')
  const [result, setResult] = useState<ConsultaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados para asignación de plan
  const [planesDisponibles, setPlanesDisponibles] = useState<Plan[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [assigningPlan, setAssigningPlan] = useState(false)
  const [fechaInicioPlan, setFechaInicioPlan] = useState('')
  
  // Estados para modificar plan existente
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [modifyingPlan, setModifyingPlan] = useState(false)
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('')
  
  // Estados para check-in
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)

  // Cargar planes disponibles
  const cargarPlanes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Intentar obtener gimnasio directamente
      let { data: gimnasio, error: gimnasioError } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      // Si el error es 406, intentar una consulta alternativa
      if (gimnasioError && gimnasioError.code === 'PGRST116') {
        // Intentar sin filtro y obtener todos los gimnasios
        const { data: gimnasios, error: allGymError } = await supabase
          .from('gimnasios')
          .select('id, usuario_id')
        
        if (!allGymError && gimnasios) {
          // Filtrar manualmente por usuario_id
          gimnasio = gimnasios.find(g => g.usuario_id === user.id)
        }
      }

      if (!gimnasio) return

      const { data: planes } = await supabase
        .from('planes')
        .select('id, nombre, precio, duracion_dias')
        .eq('gimnasio_id', gimnasio.id)
        .eq('activo', true)
        .order('precio')

      setPlanesDisponibles(planes || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  // Asignar plan al cliente
  const asignarPlan = async (planId: string) => {
    if (!result) return
    if (!fechaInicioPlan) {
      alert('⚠️ Selecciona la fecha de inicio del plan')
      return
    }

    setAssigningPlan(true)
    try {
      const plan = planesDisponibles.find(p => p.id === planId)
      if (!plan) throw new Error('Plan no encontrado')

      const fechaInicio = new Date(fechaInicioPlan)
      const fechaFin = new Date(fechaInicio)
      fechaFin.setDate(fechaFin.getDate() + plan.duracion_dias)

      // Crear nueva inscripción
      const { data: nuevaInscripcion, error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert({
          cliente_id: result.cliente.id,
          plan_id: planId,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          estado: 'activa',
          monto_pagado: plan.precio
        })
        .select()
        .single()

      if (inscripcionError) throw inscripcionError

      // Registrar pago
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
          cliente_id: result.cliente.id,
          inscripcion_id: '', // Se llenará con el ID real
          monto: plan.precio,
          metodo_pago: 'efectivo', // Por defecto
          fecha_pago: fechaInicioPlan, // Usar la fecha seleccionada
          observaciones: `Asignación de plan: ${plan.nombre}`
        })

      // Determinar si es renovación o plan nuevo
      const esRenovacion = result.estado_membresia === 'por_vencer' || result.estado_membresia === 'vencida'
      const accion = esRenovacion ? 'renovar_plan' : 'crear_plan'
      const descripcionAccion = esRenovacion ? 'renovado' : 'asignado'

      // Registrar en el log de auditoría
      await AuditLogger.registrarCambioMembresia({
        clienteId: result.cliente.id,
        inscripcionId: nuevaInscripcion?.id,
        accion,
        descripcion: `Plan "${plan.nombre}" ${descripcionAccion} al cliente ${result.cliente.nombre} ${result.cliente.apellido}`,
        datosAnteriores: result.inscripcion_activa ? {
          plan: result.inscripcion_activa.plan.nombre,
          fecha_inicio: result.inscripcion_activa.fecha_inicio,
          fecha_fin: result.inscripcion_activa.fecha_fin,
          estado: result.estado_membresia
        } : null,
        datosNuevos: {
          plan: plan.nombre,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          precio: plan.precio
        },
        metadatos: {
          fecha_pago_personalizada: fechaInicioPlan !== getBuenosAiresDateString(),
          es_renovacion: esRenovacion,
          dias_restantes_anterior: result.dias_restantes
        }
      })

      setShowPlanModal(false)
      alert(`✅ Plan "${plan.nombre}" asignado correctamente`)
      
      // Recargar información del cliente
      consultarMiembro()

    } catch (err: any) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setAssigningPlan(false)
    }
  }

  // Modificar fecha de inicio del plan actual
  const modificarFechaPlan = async () => {
    if (!result || !result.inscripcion_activa) return
    if (!nuevaFechaInicio) {
      alert('⚠️ Selecciona la nueva fecha de inicio del plan')
      return
    }

    setModifyingPlan(true)
    try {
      const inscripcion = result.inscripcion_activa
      const nuevaFecha = new Date(nuevaFechaInicio)
      const fechaFin = new Date(nuevaFecha)
      fechaFin.setDate(fechaFin.getDate() + inscripcion.plan.duracion_dias)

      // Guardar datos anteriores para el log
      const datosAnteriores = {
        fecha_inicio: inscripcion.fecha_inicio,
        fecha_fin: inscripcion.fecha_fin,
        plan: inscripcion.plan.nombre
      }

      // Actualizar la inscripción existente
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({
          fecha_inicio: nuevaFecha.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0]
        })
        .eq('id', inscripcion.id)

      if (updateError) throw updateError

      // Actualizar el pago asociado si existe
      const { error: pagoError } = await supabase
        .from('pagos')
        .update({
          fecha_pago: nuevaFechaInicio
        })
        .eq('cliente_id', result.cliente.id)
        .eq('inscripcion_id', inscripcion.id)

      // No mostrar error si no encuentra pago, puede no existir

      // Registrar en el log de auditoría
      await AuditLogger.registrarCambioMembresia({
        clienteId: result.cliente.id,
        inscripcionId: inscripcion.id,
        accion: 'modificar_fechas',
        descripcion: `Fechas del plan "${inscripcion.plan.nombre}" modificadas para ${result.cliente.nombre} ${result.cliente.apellido}`,
        datosAnteriores,
        datosNuevos: {
          fecha_inicio: nuevaFecha.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          plan: inscripcion.plan.nombre
        },
        metadatos: {
          dias_diferencia: Math.abs(
            (new Date(inscripcion.fecha_inicio).getTime() - nuevaFecha.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
      })

      setShowModifyModal(false)
      alert(`✅ Fecha del plan actualizada correctamente`)
      
      // Recargar información del cliente
      consultarMiembro()

    } catch (err: any) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setModifyingPlan(false)
    }
  }

  // Registrar asistencia (Check-in)
  const registrarAsistencia = async () => {
    if (!result) return

    setRegistrandoAsistencia(true)
    try {
      const now = getBuenosAiresDate()
      const fecha = getBuenosAiresDateString()
      const hora = now.toTimeString().split(' ')[0].substring(0, 5)

      // Verificar si ya tiene asistencia hoy
      const { data: asistenciaHoy } = await supabase
        .from('asistencias')
        .select('id')
        .eq('cliente_id', result.cliente.id)
        .eq('fecha', fecha)

      if (asistenciaHoy && asistenciaHoy.length > 0) {
        alert('⚠️ El cliente ya registró asistencia hoy')
        return
      }

      // Registrar nueva asistencia
      const { error } = await supabase
        .from('asistencias')
        .insert({
          cliente_id: result.cliente.id,
          fecha: fecha,
          hora: hora
        })

      if (error) throw error

      alert(`✅ Asistencia registrada para ${result.cliente.nombre} ${result.cliente.apellido}`)
      
      // Recargar información del cliente
      consultarMiembro()

    } catch (err: any) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setRegistrandoAsistencia(false)
    }
  }

  const consultarMiembro = async () => {
    if (!searchTerm.trim()) {
      setError('Ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      // Intentar obtener gimnasio directamente
      let { data: gimnasio, error: gimnasioError } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      // Si el error es 406, intentar una consulta alternativa
      if (gimnasioError && gimnasioError.code === 'PGRST116') {
        // Intentar sin filtro y obtener todos los gimnasios
        const { data: gimnasios, error: allGymError } = await supabase
          .from('gimnasios')
          .select('id, usuario_id')
        
        if (!allGymError && gimnasios) {
          // Filtrar manualmente por usuario_id
          gimnasio = gimnasios.find(g => g.usuario_id === user.id)
          gimnasioError = null
        } else {
          throw new Error(`Error consultando gimnasios: ${allGymError?.message || 'Error desconocido'}`)
        }
      }

      if (gimnasioError && gimnasioError.code !== 'PGRST116') {
        throw new Error(`Error obteniendo gimnasio: ${gimnasioError.message}`)
      }

      if (!gimnasio) throw new Error('Gimnasio no encontrado')

      // Buscar cliente según el tipo de búsqueda
      let query = supabase
        .from('clientes')
        .select('*')
        .eq('gimnasio_id', gimnasio.id)

      switch (searchType) {
        case 'nombre':
          query = query.or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%`)
          break
        case 'documento':
          query = query.eq('documento', searchTerm)
          break
        case 'telefono':
          query = query.eq('telefono', searchTerm)
          break
      }

      const { data: clientes } = await query

      if (!clientes || clientes.length === 0) {
        setError('Cliente no encontrado')
        return
      }

      const cliente = clientes[0] // Tomar el primer resultado

      // Buscar inscripción activa
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select(`
          *,
          plan:planes (
            nombre,
            precio,
            duracion_dias
          )
        `)
        .eq('cliente_id', cliente.id)
        .eq('estado', 'activa')
        .order('fecha_fin', { ascending: false })

      const inscripcionActiva = inscripciones?.[0] || null

      // Calcular días restantes
      let diasRestantes = 0
      let estadoMembresia: ConsultaResult['estado_membresia'] = 'sin_plan'

      if (inscripcionActiva) {
        const fechaFin = new Date(inscripcionActiva.fecha_fin)
        const hoy = getBuenosAiresDate()
        diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

        if (diasRestantes > 7) {
          estadoMembresia = 'activa'
        } else if (diasRestantes > 0) {
          estadoMembresia = 'por_vencer'
        } else {
          estadoMembresia = 'vencida'
        }
      }

      // Obtener última asistencia
      const { data: ultimaAsistencia } = await supabase
        .from('asistencias')
        .select('fecha, hora')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })
        .limit(1)

      // Contar asistencias del mes actual
      const inicioMes = getBuenosAiresDate()
      inicioMes.setDate(1)
      const finMes = getBuenosAiresDate()
      finMes.setMonth(finMes.getMonth() + 1)
      finMes.setDate(0)

      const { count: asistenciasMes } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)
        .gte('fecha', inicioMes.toISOString().split('T')[0])
        .lte('fecha', finMes.toISOString().split('T')[0])

      setResult({
        cliente,
        inscripcion_activa: inscripcionActiva,
        dias_restantes: diasRestantes,
        estado_membresia: estadoMembresia,
        ultima_asistencia: ultimaAsistencia?.[0] ? 
          `${ultimaAsistencia[0].fecha} ${ultimaAsistencia[0].hora}` : null,
        total_asistencias_mes: asistenciasMes || 0
      })

    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al consultar miembro')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: ConsultaResult['estado_membresia']) => {
    switch (estado) {
      case 'activa': return 'text-green-600 bg-green-100'
      case 'por_vencer': return 'text-yellow-600 bg-yellow-100'
      case 'vencida': return 'text-red-600 bg-red-100'
      case 'sin_plan': return 'text-gray-600 bg-gray-100'
    }
  }

  const getEstadoIcon = (estado: ConsultaResult['estado_membresia']) => {
    switch (estado) {
      case 'activa': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'por_vencer': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'vencida': return <XCircle className="h-5 w-5 text-red-600" />
      case 'sin_plan': return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getEstadoTexto = (estado: ConsultaResult['estado_membresia']) => {
    switch (estado) {
      case 'activa': return 'Membresía Activa'
      case 'por_vencer': return 'Por Vencer'
      case 'vencida': return 'Membresía Vencida'
      case 'sin_plan': return 'Sin Plan Activo'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Control de Acceso</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verifica la membresía y registra la asistencia de los clientes
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Buscar Cliente</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por
            </label>
            <select
              id="searchType"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nombre">Nombre</option>
              <option value="documento">Documento</option>
              <option value="telefono">Teléfono</option>
            </select>
          </div>

          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">
              Término de búsqueda
            </label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && consultarMiembro()}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                searchType === 'nombre' ? 'Nombre o apellido' :
                searchType === 'documento' ? 'Número de documento' :
                'Número de teléfono'
              }
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={consultarMiembro}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Search className="inline mr-2 h-4 w-4" />
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {result && (
        <div className="space-y-6">
          {/* Información del cliente */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información del Cliente
              </h3>
              
              {/* Botón de Check-in prominente */}
              {result.estado_membresia === 'activa' && (
                <button
                  onClick={registrarAsistencia}
                  disabled={registrandoAsistencia}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <UserCheck className="mr-2 h-6 w-6" />
                  {registrandoAsistencia ? 'Registrando...' : 'CHECK-IN'}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="text-lg text-gray-900">{result.cliente.nombre} {result.cliente.apellido}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Documento</p>
                <p className="text-gray-900">{result.cliente.documento || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{result.cliente.email || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{result.cliente.telefono || 'No especificado'}</p>
              </div>
            </div>
            
            {/* Mensaje si no puede hacer check-in */}
            {result.estado_membresia !== 'activa' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ No puede ingresar: {
                    result.estado_membresia === 'vencida' ? 'Membresía vencida' :
                    result.estado_membresia === 'por_vencer' ? 'Membresía próxima a vencer' :
                    'Sin membresía activa'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Estado de la membresía */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Estado de Membresía
              </h3>
              
              {/* Botón para modificar plan activo */}
              {result.inscripcion_activa && (
                <button
                  onClick={() => {
                    setNuevaFechaInicio(result.inscripcion_activa!.fecha_inicio)
                    setShowModifyModal(true)
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Modificar Plan
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(result.estado_membresia)}`}>
                {getEstadoIcon(result.estado_membresia)}
                <span className="ml-2">{getEstadoTexto(result.estado_membresia)}</span>
              </div>
            </div>

            {result.inscripcion_activa ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <p className="text-gray-900">{result.inscripcion_activa.plan.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Precio</p>
                  <p className="text-gray-900">${result.inscripcion_activa.plan.precio}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Vencimiento</p>
                  <p className="text-gray-900">{new Date(result.inscripcion_activa.fecha_fin).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Días Restantes</p>
                  <p className={`font-semibold ${
                    result.dias_restantes > 7 ? 'text-green-600' :
                    result.dias_restantes > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.dias_restantes > 0 ? `${result.dias_restantes} días` : 'Vencida'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin Plan Activo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Este cliente no tiene ningún plan de membresía activo
                </p>
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Actividad Reciente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Última Asistencia</p>
                <p className="text-gray-900">
                  {result.ultima_asistencia ? 
                    new Date(result.ultima_asistencia).toLocaleString() : 
                    'Sin registro de asistencia'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Asistencias este mes</p>
                <p className="text-2xl font-semibold text-blue-600">{result.total_asistencias_mes}</p>
              </div>
            </div>
          </div>

          {/* Acciones recomendadas */}
          {result.estado_membresia !== 'activa' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-yellow-800">Acciones Recomendadas</h3>
                
                {/* Botones de acción rápida */}
                <div className="flex space-x-2">
                  {(result.estado_membresia === 'sin_plan' || result.estado_membresia === 'vencida') && (
                    <button
                      onClick={() => {
                        cargarPlanes()
                        setFechaInicioPlan(getBuenosAiresDateString()) // Fecha actual por defecto
                        setShowPlanModal(true)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Asignar Plan
                    </button>
                  )}
                  
                  {result.estado_membresia === 'por_vencer' && (
                    <button
                      onClick={() => {
                        cargarPlanes()
                        setFechaInicioPlan(getBuenosAiresDateString()) // Fecha actual por defecto
                        setShowPlanModal(true)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Renovar
                    </button>
                  )}
                </div>
              </div>
              
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.estado_membresia === 'vencida' && (
                  <>
                    <li>• La membresía está vencida - contactar al cliente</li>
                    <li>• Ofrecer renovación del plan</li>
                    <li>• Considerar descuentos por renovación temprana</li>
                  </>
                )}
                {result.estado_membresia === 'por_vencer' && (
                  <>
                    <li>• La membresía vence en {result.dias_restantes} días</li>
                    <li>• Recordar al cliente sobre la renovación</li>
                    <li>• Programar seguimiento</li>
                  </>
                )}
                {result.estado_membresia === 'sin_plan' && (
                  <>
                    <li>• Cliente sin plan activo</li>
                    <li>• Ofrecer planes disponibles</li>
                    <li>• Considerar promociones especiales</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Modal para seleccionar plan */}
          {showPlanModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Seleccionar Plan para {result.cliente.nombre} {result.cliente.apellido}
                  </h3>
                  
                  {/* Campo de fecha de inicio */}
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label htmlFor="fechaInicio" className="block text-sm font-medium text-blue-800 mb-2">
                      Fecha de Inicio del Plan
                    </label>
                    <input
                      type="date"
                      id="fechaInicio"
                      value={fechaInicioPlan}
                      onChange={(e) => setFechaInicioPlan(e.target.value)}
                      max={getBuenosAiresDateString()} // No puede ser superior a hoy
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Cambia la fecha si el pago se realizó anteriormente
                    </p>
                  </div>
                  
                  {planesDisponibles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {planesDisponibles.map((plan) => (
                        <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{plan.nombre}</h4>
                              <p className="text-sm text-gray-600">
                                ${plan.precio} - {plan.duracion_dias} días
                              </p>
                              {fechaInicioPlan && (
                                <p className="text-xs text-blue-600 mt-1">
                                  📅 Vence: {(() => {
                                    const fechaFin = new Date(fechaInicioPlan)
                                    fechaFin.setDate(fechaFin.getDate() + plan.duracion_dias)
                                    return fechaFin.toLocaleDateString()
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
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay planes disponibles</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Primero crea planes en la sección "Planes"
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-6">
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
          {showModifyModal && result && result.inscripcion_activa && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Modificar Fecha del Plan: {result.inscripcion_activa.plan.nombre}
                  </h3>
                  
                  <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-3">Información Actual</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-orange-600">Fecha Inicio Actual:</span>
                        <p className="font-medium">{new Date(result.inscripcion_activa.fecha_inicio).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-orange-600">Fecha Fin Actual:</span>
                        <p className="font-medium">{new Date(result.inscripcion_activa.fecha_fin).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label htmlFor="nuevaFechaInicio" className="block text-sm font-medium text-blue-800 mb-2">
                      Nueva Fecha de Inicio del Plan
                    </label>
                    <input
                      type="date"
                      id="nuevaFechaInicio"
                      value={nuevaFechaInicio}
                      onChange={(e) => setNuevaFechaInicio(e.target.value)}
                      max={getBuenosAiresDateString()} // No puede ser superior a hoy
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {nuevaFechaInicio && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          📅 <strong>Nueva fecha de vencimiento:</strong> {(() => {
                            const fechaFin = new Date(nuevaFechaInicio)
                            fechaFin.setDate(fechaFin.getDate() + result.inscripcion_activa!.plan.duracion_dias)
                            return fechaFin.toLocaleDateString()
                          })()}
                        </p>
                      </div>
                    )}
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
                      disabled={modifyingPlan || !nuevaFechaInicio}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {modifyingPlan ? 'Modificando...' : 'Actualizar Fecha'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}