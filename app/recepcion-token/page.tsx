'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Search, User, Calendar, CreditCard, CheckCircle, XCircle, Monitor, Building, Wifi, WifiOff } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface GimnasioInfo {
  id: string
  nombre: string
  direccion: string
}

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

export default function RecepcionToken() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [gimnasioInfo, setGimnasioInfo] = useState<GimnasioInfo | null>(null)
  const [tokenValidated, setTokenValidated] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [showRenovarModal, setShowRenovarModal] = useState(false)
  const [showLoginRecepcion, setShowLoginRecepcion] = useState(false)
  const [recepcionData, setRecepcionData] = useState<any>(null)
  const [recepcionistaActual, setRecepcionistaActual] = useState('')
  const [loginForm, setLoginForm] = useState({ nombre: '', password: '' })
  const [planSeleccionado, setPlanSeleccionado] = useState('')
  const [planesDisponibles, setPlanesDisponibles] = useState<any[]>([])
  const [renovandoPlan, setRenovandoPlan] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Verificar conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Validar token al cargar
  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setError('Token de acceso requerido')
        setValidatingToken(false)
        return
      }

      try {
        // Crear cliente de Supabase sin autenticación para consultas públicas
        const supabasePublic = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Buscar gimnasio por token usando cliente público
        const { data: gimnasio, error: gymError } = await supabasePublic
          .from('gimnasios')
          .select(`
            id, 
            nombre, 
            direccion,
            recepcionista_1_nombre,
            recepcionista_1_password,
            recepcionista_2_nombre, 
            recepcionista_2_password,
            recepcionista_3_nombre,
            recepcionista_3_password,
            recepcionista_4_nombre,
            recepcionista_4_password
          `)
          .eq('access_token', token)
          .single()

        if (gymError || !gimnasio) {
          setError('Token de acceso inválido o expirado')
          setValidatingToken(false)
          return
        }

        setGimnasioInfo({
          id: gimnasio.id,
          nombre: gimnasio.nombre,
          direccion: gimnasio.direccion
        })
        setRecepcionData(gimnasio)
        setTokenValidated(true)
        setValidatingToken(false)

        // Cargar planes disponibles del gimnasio
        const { data: planes } = await supabasePublic
          .from('planes')
          .select('id, nombre, precio, duracion_dias')
          .eq('gimnasio_id', gimnasio.id)
          .eq('activo', true)
          .order('precio')
        
        if (planes) {
          setPlanesDisponibles(planes)
        }

      } catch (error) {
        setError('Error validando acceso')
        setValidatingToken(false)
      }
    }

    validarToken()
  }, [token])

  const loginRecepcionista = () => {
    if (!recepcionData) return

    const { nombre, password } = loginForm
    let nombreEncontrado = ''

    // Verificar credenciales contra los 4 recepcionistas
    for (let i = 1; i <= 4; i++) {
      const nombreCampo = recepcionData[`recepcionista_${i}_nombre`]
      const passwordCampo = recepcionData[`recepcionista_${i}_password`]
      
      if (nombreCampo && passwordCampo && 
          nombre.toLowerCase().trim() === nombreCampo.toLowerCase().trim() && 
          password === passwordCampo) {
        nombreEncontrado = nombreCampo
        break
      }
    }

    if (nombreEncontrado) {
      setRecepcionistaActual(nombreEncontrado)
      setShowLoginRecepcion(false)
      setLoginForm({ nombre: '', password: '' })
      setLoginError('')
      setShowRenovarModal(true)
    } else {
      setLoginError('Nombre o contraseña incorrectos')
    }
  }

  const renovarPlan = async () => {
    if (!clienteInfo || !planSeleccionado || !recepcionistaActual) return

    setRenovandoPlan(true)
    try {
      const planElegido = planesDisponibles.find(p => p.id === planSeleccionado)
      if (!planElegido) return

      const fechaInicio = getBuenosAiresDate()
      const fechaFin = getBuenosAiresDate()
      fechaFin.setDate(fechaInicio.getDate() + planElegido.duracion_dias)

      // Crear nueva inscripción
      const { error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert({
          cliente_id: clienteInfo.id,
          plan_id: planSeleccionado,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          estado: 'activa',
          monto_pagado: planElegido.precio
        })

      if (inscripcionError) {
        alert('Error renovando plan: ' + inscripcionError.message)
        return
      }

      // Registrar movimiento con el recepcionista
      await supabase
        .from('movimientos_recepcion')
        .insert({
          gimnasio_id: gimnasioInfo!.id,
          cliente_id: clienteInfo.id,
          recepcionista: recepcionistaActual,
          accion: 'renovacion_plan',
          detalles: `Plan renovado: ${planElegido.nombre} - $${planElegido.precio}`,
          fecha: getBuenosAiresISOString()
        })

      alert(`✅ Plan renovado exitosamente por ${recepcionistaActual}!`)
      setShowRenovarModal(false)
      setRecepcionistaActual('')
      setPlanSeleccionado('')
      
      // Actualizar info del cliente
      buscarCliente()

    } catch (error) {
      alert('Error inesperado renovando plan')
    } finally {
      setRenovandoPlan(false)
    }
  }

  const buscarCliente = async () => {
    if (!busqueda.trim()) {
      setError('Ingresa un documento, nombre o teléfono')
      return
    }

    if (!gimnasioInfo) {
      setError('Error: Gimnasio no identificado')
      return
    }

    setLoading(true)
    setError('')
    setClienteInfo(null)

    try {
      // Crear cliente público para consultas sin autenticación
      const supabasePublic = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Buscar por documento, nombre, apellido o teléfono EN EL GIMNASIO DEL TOKEN
      const { data: clientes, error: searchError } = await supabasePublic
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
        .eq('gimnasio_id', gimnasioInfo.id)
        .or(`documento.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)

      if (searchError) {
        setError(searchError.message)
        return
      }

      if (!clientes || clientes.length === 0) {
        setError('Cliente no encontrado en este gimnasio')
        return
      }

      const cliente = clientes[0]

      // Obtener última asistencia
      const { data: ultimaAsistencia } = await supabasePublic
        .from('asistencias')
        .select('fecha')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      // Contar total de asistencias
      const { count: totalAsistencias } = await supabasePublic
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

  // Loading de validación
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acceso...</p>
        </div>
      </div>
    )
  }

  // Error de token
  if (!tokenValidated || !gimnasioInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow p-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">
            Contacta al administrador del gimnasio para obtener un enlace de acceso válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">
                Terminal Recepción - {hoy}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-green-200" />
                <span className="text-green-100 font-medium">{gimnasioInfo.nombre}</span>
              </div>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-200" />
                ) : (
                  <WifiOff className="h-4 w-4 text-yellow-300" />
                )}
                <span className="text-green-100 text-sm">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Info del token access */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🔗 Acceso Genérico Activo</h3>
            <p className="text-green-700 text-sm">
              Conectado a <strong>{gimnasioInfo.nombre}</strong> - Acceso directo sin autenticación
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
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={buscarCliente}
                disabled={loading || !isOnline}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-lg font-semibold"
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

            {!isOnline && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  ⚠️ Sin conexión a internet. Algunas funciones pueden no estar disponibles.
                </p>
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
                          <p className="text-2xl font-bold text-green-800">{planActivo.planes.nombre}</p>
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

                {/* Botones de acción */}
                <div className="pt-4 space-y-4">
                  {planActivo && clienteInfo.activo ? (
                    <button
                      onClick={registrarAsistencia}
                      disabled={registrandoAsistencia || !isOnline}
                      className="w-full bg-green-600 text-white py-6 px-8 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-3 text-xl font-bold"
                    >
                      <CheckCircle className="h-8 w-8" />
                      <span>
                        {registrandoAsistencia ? 'Registrando...' : '✅ REGISTRAR ASISTENCIA'}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-full bg-red-100 border-2 border-red-300 rounded-lg p-6 text-center">
                        <p className="text-red-800 text-xl font-bold">
                          ⚠️ NO PUEDE ACCEDER
                        </p>
                        <p className="text-red-600 text-lg">
                          El cliente debe renovar su membresía
                        </p>
                      </div>
                      
                      {/* Botón para renovar plan */}
                      <button
                        onClick={() => setShowLoginRecepcion(true)}
                        disabled={!isOnline}
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-lg font-semibold"
                      >
                        <CreditCard className="h-6 w-6" />
                        <span>🔓 RENOVAR MEMBRESÍA</span>
                      </button>
                    </div>
                  )}

                  {/* Botón renovar plan también para clientes activos */}
                  {planActivo && clienteInfo.activo && (
                    <button
                      onClick={() => setShowLoginRecepcion(true)}
                      disabled={!isOnline}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Renovar/Extender Plan</span>
                    </button>
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

      {/* Modal de Login Recepcionista */}
      {showLoginRecepcion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔐 Autorización de Recepcionista</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Recepcionista
                </label>
                <input
                  type="text"
                  value={loginForm.nombre}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa tu nombre"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Autorización
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código secreto"
                  onKeyPress={(e) => e.key === 'Enter' && loginRecepcionista()}
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowLoginRecepcion(false)
                    setLoginForm({ nombre: '', password: '' })
                    setLoginError('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={loginRecepcionista}
                  disabled={!loginForm.nombre || !loginForm.password}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Autorizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renovación de Plan */}
      {showRenovarModal && recepcionistaActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              💳 Renovar Membresía - {clienteInfo?.nombre} {clienteInfo?.apellido}
            </h3>
            
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                <strong>Autorizado por:</strong> {recepcionistaActual}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Plan
                </label>
                <select
                  value={planSeleccionado}
                  onChange={(e) => setPlanSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un plan...</option>
                  {planesDisponibles.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio} ({plan.duracion_dias} días)
                    </option>
                  ))}
                </select>
              </div>

              {planSeleccionado && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {(() => {
                    const plan = planesDisponibles.find(p => p.id === planSeleccionado)
                    const fechaInicio = getBuenosAiresDate()
                    const fechaFin = getBuenosAiresDate()
                    fechaFin.setDate(fechaInicio.getDate() + plan!.duracion_dias)
                    
                    return (
                      <div className="text-blue-800 text-sm">
                        <p><strong>Plan:</strong> {plan?.nombre}</p>
                        <p><strong>Precio:</strong> ${plan?.precio}</p>
                        <p><strong>Duración:</strong> {plan?.duracion_dias} días</p>
                        <p><strong>Vigencia:</strong> {fechaInicio.toLocaleDateString()} al {fechaFin.toLocaleDateString()}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRenovarModal(false)
                    setRecepcionistaActual('')
                    setPlanSeleccionado('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={renovarPlan}
                  disabled={!planSeleccionado || renovandoPlan}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {renovandoPlan ? 'Renovando...' : 'Confirmar Renovación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}