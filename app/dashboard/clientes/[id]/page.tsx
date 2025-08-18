'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cliente, Inscripcion, Asistencia, Pago } from '@/types'
import { Edit, Calendar, CreditCard, MapPin, Phone, Mail, User } from 'lucide-react'
import Link from 'next/link'

interface ClienteConDetalles extends Cliente {
  inscripciones: (Inscripcion & { plan: { nombre: string; precio: number } })[]
  asistencias: Asistencia[]
  pagos: Pago[]
}

export default function ClienteDetailPage() {
  const { id } = useParams()
  const [cliente, setCliente] = useState<ClienteConDetalles | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCliente = async () => {
      try {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select(`
            *,
            inscripciones (
              *,
              plan:planes (nombre, precio)
            ),
            asistencias (*),
            pagos (*)
          `)
          .eq('id', id)
          .single()

        setCliente(clienteData)
      } catch (error) {
        console.error('Error loading client:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadCliente()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {cliente.nombre} {cliente.apellido}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Información detallada del cliente
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={`/dashboard/clientes/${cliente.id}/editar`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Información personal */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Personal
            </h3>
            <dl className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Documento</dt>
                  <dd className="text-sm text-gray-900">{cliente.documento || 'No especificado'}</dd>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{cliente.email || 'No especificado'}</dd>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="text-sm text-gray-900">{cliente.telefono || 'No especificado'}</dd>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                  <dd className="text-sm text-gray-900">{cliente.direccion || 'No especificado'}</dd>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                  <dd className="text-sm text-gray-900">
                    {cliente.fecha_nacimiento 
                      ? new Date(cliente.fecha_nacimiento).toLocaleDateString()
                      : 'No especificado'
                    }
                  </dd>
                </div>
              </div>
            </dl>
            
            {cliente.observaciones && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Observaciones</h4>
                <p className="text-sm text-gray-600">{cliente.observaciones}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actividad y estadísticas */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Inscripciones */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Inscripciones Activas
              </h3>
              {cliente.inscripciones.length > 0 ? (
                <div className="space-y-3">
                  {cliente.inscripciones.map((inscripcion) => (
                    <div key={inscripcion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {inscripcion.plan.nombre}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(inscripcion.fecha_inicio).toLocaleDateString()} - {' '}
                            {new Date(inscripcion.fecha_fin).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          inscripcion.estado === 'activa' 
                            ? 'bg-green-100 text-green-800'
                            : inscripcion.estado === 'vencida'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inscripcion.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Precio: ${inscripcion.plan.precio}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay inscripciones activas</p>
              )}
            </div>

            {/* Últimas asistencias */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Últimas Asistencias
              </h3>
              {cliente.asistencias.length > 0 ? (
                <div className="space-y-2">
                  {cliente.asistencias
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .slice(0, 5)
                    .map((asistencia) => (
                      <div key={asistencia.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm text-gray-900">
                          {new Date(asistencia.fecha).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {asistencia.hora}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay registros de asistencia</p>
              )}
            </div>

            {/* Historial de pagos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Historial de Pagos
              </h3>
              {cliente.pagos.length > 0 ? (
                <div className="space-y-2">
                  {cliente.pagos
                    .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())
                    .slice(0, 5)
                    .map((pago) => (
                      <div key={pago.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <span className="text-sm text-gray-900">
                            ${pago.monto}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({pago.metodo_pago})
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(pago.fecha_pago).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay registros de pagos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}