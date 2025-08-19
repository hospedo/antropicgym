'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Calendar, CreditCard, Activity } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface ClienteData {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
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
  asistencias_count: number
  ultimo_pago: {
    fecha_pago: string
    monto: number
  } | null
}

export default function MemberDashboard() {
  const [clienteData, setClienteData] = useState<ClienteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Obtener datos del cliente con inscripciones
        const { data: cliente } = await supabase
          .from('clientes')
          .select(`
            id,
            nombre,
            apellido,
            email,
            telefono,
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
          .eq('usuario_id', user.id)
          .single()

        if (cliente) {
          // Contar asistencias del último mes
          const lastMonth = getBuenosAiresDate()
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          
          const { count: asistenciasCount } = await supabase
            .from('asistencias')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_id', cliente.id)
            .gte('fecha', lastMonth.toISOString().split('T')[0])

          // Obtener último pago
          const { data: ultimoPago } = await supabase
            .from('pagos')
            .select('fecha_pago, monto')
            .eq('cliente_id', cliente.id)
            .order('fecha_pago', { ascending: false })
            .limit(1)
            .single()

          setClienteData({
            ...cliente,
            asistencias_count: asistenciasCount || 0,
            ultimo_pago: ultimoPago,
            inscripciones: cliente.inscripciones.map(inscripcion => ({
              ...inscripcion,
              planes: inscripcion.planes[0] || { nombre: '', precio: 0 }
            }))
          })
        }
      } catch (error) {
        console.error('Error fetching member data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!clienteData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No se encontraron datos del miembro
        </h2>
        <p className="text-gray-600">
          Contacta al administrador del gimnasio para más información.
        </p>
      </div>
    )
  }

  const inscripcionActiva = clienteData.inscripciones.find(i => i.estado === 'activa')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Hola, {clienteData.nombre}!
            </h1>
            <p className="text-gray-600">
              Bienvenido a tu dashboard personal
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Actual */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Plan Actual</p>
              <p className="text-lg font-semibold text-gray-900">
                {inscripcionActiva ? inscripcionActiva.planes.nombre : 'Sin plan activo'}
              </p>
              {inscripcionActiva && (
                <p className="text-sm text-gray-500">
                  Vence: {new Date(inscripcionActiva.fecha_fin).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Asistencias */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Asistencias (30 días)</p>
              <p className="text-lg font-semibold text-gray-900">
                {clienteData.asistencias_count}
              </p>
              <p className="text-sm text-gray-500">visitas</p>
            </div>
          </div>
        </div>

        {/* Último Pago */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Último Pago</p>
              {clienteData.ultimo_pago ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">
                    ${clienteData.ultimo_pago.monto}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(clienteData.ultimo_pago.fecha_pago).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-gray-900">Sin pagos</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Status */}
      {inscripcionActiva && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de tu Membresía
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full h-3 w-3 mr-3"></div>
              <div>
                <p className="font-medium text-green-800">Membresía Activa</p>
                <p className="text-green-600 text-sm">
                  Tu plan {inscripcionActiva.planes.nombre} está activo hasta el{' '}
                  {new Date(inscripcionActiva.fecha_fin).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!inscripcionActiva && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de tu Membresía
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-yellow-500 rounded-full h-3 w-3 mr-3"></div>
              <div>
                <p className="font-medium text-yellow-800">Sin Plan Activo</p>
                <p className="text-yellow-600 text-sm">
                  Contacta al gimnasio para renovar tu membresía
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}