'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cliente, Asistencia } from '@/types'
import { Search, UserCheck, Calendar, Clock, Users } from 'lucide-react'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface AsistenciaConCliente extends Asistencia {
  cliente: Cliente
}

export default function AsistenciasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [asistenciasHoy, setAsistenciasHoy] = useState<AsistenciaConCliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(getBuenosAiresDateString())
  const [loading, setLoading] = useState(true)
  const [gimnasioId, setGimnasioId] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (!gimnasio) return

        setGimnasioId(gimnasio.id)

        const [clientesResponse, asistenciasResponse] = await Promise.all([
          supabase
            .from('clientes')
            .select('*')
            .eq('gimnasio_id', gimnasio.id)
            .eq('activo', true)
            .order('nombre'),
          supabase
            .from('asistencias')
            .select(`
              *,
              cliente:clientes (*)
            `)
            .eq('fecha', selectedDate)
            .in('cliente_id', 
              await supabase
                .from('clientes')
                .select('id')
                .eq('gimnasio_id', gimnasio.id)
                .then(res => res.data?.map(c => c.id) || [])
            )
            .order('hora', { ascending: false })
        ])

        setClientes(clientesResponse.data || [])
        setAsistenciasHoy(asistenciasResponse.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedDate])

  const handleCheckIn = async (clienteId: string) => {
    try {
      const now = getBuenosAiresDate()
      const hora = now.toTimeString().split(' ')[0].substring(0, 5)

      const { data, error } = await supabase
        .from('asistencias')
        .insert({
          cliente_id: clienteId,
          fecha: selectedDate,
          hora: hora
        })
        .select(`
          *,
          cliente:clientes (*)
        `)
        .single()

      if (error) throw error

      setAsistenciasHoy(prev => [data, ...prev])
      
      alert('¡Check-in registrado correctamente!')
    } catch (error) {
      console.error('Error registering check-in:', error)
      alert('Error al registrar la asistencia')
    }
  }

  const filteredClientes = clientes.filter(cliente => {
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase()
    const term = searchTerm.toLowerCase()
    return nombreCompleto.includes(term) || 
           cliente.email?.toLowerCase().includes(term) ||
           cliente.telefono?.includes(term) ||
           cliente.documento?.toLowerCase().includes(term)
  })

  const clientesYaRegistrados = asistenciasHoy.map(a => a.cliente_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Control de Asistencias</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registra las asistencias diarias de tus clientes
        </p>
      </div>

      {/* Filtros y fecha */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, email, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lista de clientes para check-in */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Clientes Activos ({filteredClientes.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredClientes.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredClientes.map((cliente) => {
                  const yaRegistrado = clientesYaRegistrados.includes(cliente.id)
                  return (
                    <div key={cliente.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nombre} {cliente.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cliente.email || cliente.telefono}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(cliente.id)}
                        disabled={yaRegistrado}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          yaRegistrado
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        }`}
                      >
                        <UserCheck className="mr-1 h-4 w-4" />
                        {yaRegistrado ? 'Registrado' : 'Check-in'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes activos'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Registra clientes primero'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Asistencias del día */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Asistencias del {new Date(selectedDate).toLocaleDateString()} ({asistenciasHoy.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {asistenciasHoy.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {asistenciasHoy.map((asistencia) => (
                  <div key={asistencia.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {asistencia.cliente.nombre} {asistencia.cliente.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        {asistencia.cliente.email || asistencia.cliente.telefono}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="mr-1 h-4 w-4" />
                        {asistencia.hora}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(asistencia.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Sin asistencias registradas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Las asistencias aparecerán aquí una vez registradas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Asistencias Hoy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {asistenciasHoy.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    % Asistencia
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.length > 0 ? Math.round((asistenciasHoy.length / clientes.length) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}