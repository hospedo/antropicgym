'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Pago, Cliente, Inscripcion } from '@/types'
import { Plus, DollarSign, Calendar, CreditCard, Filter } from 'lucide-react'
import Link from 'next/link'

interface PagoConDetalles extends Pago {
  cliente: Cliente
  inscripcion: Inscripcion & { plan: { nombre: string } }
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMetodo, setFiltroMetodo] = useState<string>('')
  const [filtroFecha, setFiltroFecha] = useState<string>('')

  useEffect(() => {
    const loadPagos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (!gimnasio) return

        const clienteIds = await supabase
          .from('clientes')
          .select('id')
          .eq('gimnasio_id', gimnasio.id)
          .then(res => res.data?.map(c => c.id) || [])

        const { data: pagosData } = await supabase
          .from('pagos')
          .select(`
            *,
            cliente:clientes (*),
            inscripcion:inscripciones (
              *,
              plan:planes (nombre)
            )
          `)
          .in('cliente_id', clienteIds)
          .order('created_at', { ascending: false })

        setPagos(pagosData || [])
      } catch (error) {
        console.error('Error loading payments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPagos()
  }, [])

  const pagosFiltrados = pagos.filter(pago => {
    const matchMetodo = !filtroMetodo || pago.metodo_pago === filtroMetodo
    const matchFecha = !filtroFecha || pago.fecha_pago === filtroFecha
    return matchMetodo && matchFecha
  })

  const totalRecaudado = pagosFiltrados.reduce((sum, pago) => sum + Number(pago.monto), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Registro de pagos y cobros de membresías
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/pagos/nuevo"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar Pago
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="metodo" className="block text-sm font-medium text-gray-700">
              Método de Pago
            </label>
            <select
              id="metodo"
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
              Fecha de Pago
            </label>
            <input
              type="date"
              id="fecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroMetodo('')
                setFiltroFecha('')
              }}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-green-50 overflow-hidden rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-500 truncate">
                      Total Recaudado
                    </dt>
                    <dd className="text-lg font-medium text-green-900">
                      ${totalRecaudado.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 overflow-hidden rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-500 truncate">
                      Total Pagos
                    </dt>
                    <dd className="text-lg font-medium text-blue-900">
                      {pagosFiltrados.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 overflow-hidden rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-500 truncate">
                      Promedio por Pago
                    </dt>
                    <dd className="text-lg font-medium text-purple-900">
                      ${pagosFiltrados.length > 0 ? (totalRecaudado / pagosFiltrados.length).toFixed(2) : '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagosFiltrados.map((pago) => (
                    <tr key={pago.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pago.cliente.nombre} {pago.cliente.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pago.cliente.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pago.inscripcion.plan.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${Number(pago.monto).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                          pago.metodo_pago === 'efectivo'
                            ? 'bg-green-100 text-green-800'
                            : pago.metodo_pago === 'tarjeta'
                            ? 'bg-blue-100 text-blue-800'
                            : pago.metodo_pago === 'transferencia'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pago.metodo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pago.fecha_pago).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {pago.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay pagos registrados
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Los pagos aparecerán aquí una vez registrados
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}