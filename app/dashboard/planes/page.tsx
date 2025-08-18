'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plan } from '@/types'
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlanes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (!gimnasio) return

        const { data: planesData } = await supabase
          .from('planes')
          .select('*')
          .eq('gimnasio_id', gimnasio.id)
          .order('created_at', { ascending: false })

        setPlanes(planesData || [])
      } catch (error) {
        console.error('Error loading plans:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlanes()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan?')) return

    try {
      const { error } = await supabase
        .from('planes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPlanes(planes.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Error al eliminar el plan')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('planes')
        .update({ activo: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setPlanes(planes.map(p => 
        p.id === id ? { ...p, activo: !currentStatus } : p
      ))
    } catch (error) {
      console.error('Error updating plan status:', error)
      alert('Error al actualizar el estado del plan')
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Planes y Membresías</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona los planes de entrenamiento de tu gimnasio
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/planes/nuevo"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Plan
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {planes.map((plan) => (
            <div key={plan.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {plan.nombre}
                  </h3>
                  <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                    plan.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {plan.descripcion || 'Sin descripción'}
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="font-semibold text-green-600">
                      ${plan.precio}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{plan.duracion_dias} días</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/planes/${plan.id}/editar`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleActive(plan.id, plan.activo)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      plan.activo
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {plan.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {planes.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <DollarSign className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay planes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer plan de entrenamiento.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/planes/nuevo"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Plan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}