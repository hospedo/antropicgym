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
      setError('Ingresa tu número de documento')
      return
    }

    setLoading(true)
    setError('')
    setClienteInfo(null)

    try {
      // Buscar solo por documento
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
        .eq('documento', busqueda.trim())

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
          <div className="flex justify-between h-24">
            <div className="flex items-center">
              <Monitor className="h-16 w-16 text-white mr-6" />
              <h1 className="text-5xl font-black text-white">
                TERMINAL ACCESO - {hoy}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <div className="space-y-16">

          {/* Búsqueda */}
          <div className="bg-white rounded-3xl shadow-2xl p-20">
            <div className="space-y-20">
              <div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="NÚMERO DE DOCUMENTO"
                  className="w-full px-16 py-16 border-8 border-gray-400 rounded-3xl text-8xl text-center focus:outline-none focus:ring-8 focus:ring-blue-500 focus:border-blue-500 font-black shadow-2xl"
                  autoFocus
                />
              </div>
              <button
                onClick={buscarCliente}
                disabled={loading}
                className="w-full px-20 py-20 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-8 text-8xl font-black shadow-2xl transform transition-transform hover:scale-105"
              >
                <Search className="h-24 w-24" />
                <span>{loading ? 'BUSCANDO...' : 'CONSULTAR'}</span>
              </button>
            </div>

            {error && (
              <div className="mt-12 bg-red-50 border-8 border-red-200 rounded-3xl p-12">
                <p className="text-red-600 text-6xl font-black text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Información del Cliente */}
          {clienteInfo && (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Mensaje de Bienvenida */}
              {planActivo && clienteInfo.activo ? (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-20">
                  <h2 className="text-9xl font-black mb-8">¡BIENVENIDO/A!</h2>
                  <p className="text-6xl font-black">
                    {clienteInfo.nombre} {clienteInfo.apellido}
                  </p>
                  <p className="text-4xl mt-4 opacity-90 font-bold">DNI: {clienteInfo.documento}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-20">
                  <h2 className="text-9xl font-black mb-8">⚠️ SIN ACCESO</h2>
                  <p className="text-6xl font-black">
                    {clienteInfo.nombre} {clienteInfo.apellido}
                  </p>
                  <p className="text-4xl mt-4 opacity-90 font-bold">DNI: {clienteInfo.documento}</p>
                  <p className="text-3xl mt-6 bg-red-700 bg-opacity-50 py-4 px-8 rounded-3xl inline-block font-bold">
                    Membresía vencida - Consultar en recepción
                  </p>
                </div>
              )}

              <div className="p-16">
                {/* Botón de registro */}
                {planActivo && clienteInfo.activo ? (
                  <button
                    onClick={registrarAsistencia}
                    disabled={registrandoAsistencia}
                    className="w-full bg-green-600 text-white py-16 px-16 rounded-3xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-8 text-7xl font-black shadow-2xl transform transition-transform hover:scale-105"
                  >
                    <CheckCircle className="h-24 w-24" />
                    <span>
                      {registrandoAsistencia ? 'REGISTRANDO...' : '✅ ACCESO AUTORIZADO'}
                    </span>
                  </button>
                ) : (
                  <div className="w-full bg-red-100 border-8 border-red-300 rounded-3xl p-16 text-center">
                    <p className="text-red-800 text-7xl font-black mb-4">
                      🚫 ACCESO DENEGADO
                    </p>
                    <p className="text-red-600 text-4xl font-bold">
                      Renovar membresía en recepción
                    </p>
                  </div>
                )}

                {/* Botón para nueva búsqueda */}
                <button
                  onClick={() => {
                    setClienteInfo(null)
                    setBusqueda('')
                    setError('')
                  }}
                  className="w-full mt-12 bg-blue-600 text-white py-12 px-12 rounded-3xl hover:bg-blue-700 flex items-center justify-center space-x-6 text-5xl font-black shadow-2xl transform transition-transform hover:scale-105"
                >
                  <Search className="h-16 w-16" />
                  <span>NUEVA CONSULTA</span>
                </button>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {!clienteInfo && !loading && (
            <div className="bg-blue-50 border-8 border-blue-200 rounded-3xl p-16">
              <h3 className="text-6xl font-black text-blue-900 mb-12 text-center">📱 INSTRUCCIONES:</h3>
              <ul className="text-blue-800 space-y-8 text-4xl font-bold">
                <li>• Ingresa tu NÚMERO DE DOCUMENTO</li>
                <li>• Presiona ENTER o toca "CONSULTAR"</li>
                <li>• Si tienes membresía ACTIVA aparecerá en VERDE ✅</li>
                <li>• Presiona "ACCESO AUTORIZADO" para entrar al gym</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}