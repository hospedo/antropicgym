'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cliente } from '@/types'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

        const { data: clientesData } = await supabase
          .from('clientes')
          .select(`
            *,
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
          .eq('gimnasio_id', gimnasio.id)
          .order('created_at', { ascending: false })

        setClientes(clientesData || [])
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setClientes(clientes.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error al eliminar el cliente')
    }
  }

  const tienePlanActivo = (cliente: any) => {
    if (!cliente.inscripciones || cliente.inscripciones.length === 0) return false
    
    const ahora = new Date()
    return cliente.inscripciones.some((inscripcion: any) => 
      inscripcion.estado === 'activa' && new Date(inscripcion.fecha_fin) >= ahora
    )
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.includes(searchTerm) ||
    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona los clientes de tu gimnasio
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/clientes/nuevo"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

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
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {cliente.nombre} {cliente.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cliente.documento}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.email}</div>
                        <div className="text-sm text-gray-500">{cliente.telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                          tienePlanActivo(cliente) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tienePlanActivo(cliente) ? 'Con Plan Activo' : 'Sin Plan Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cliente.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/clientes/${cliente.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/clientes/${cliente.id}/editar`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredClientes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
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