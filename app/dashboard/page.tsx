'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, CreditCard, Calendar, TrendingUp } from 'lucide-react'

interface Stats {
  totalClientes: number
  clientesActivos: number
  totalPlanes: number
  asistenciasHoy: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    clientesActivos: 0,
    totalPlanes: 0,
    asistenciasHoy: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: gimnasios } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (!gimnasios) return

        const [
          { count: totalClientes },
          { count: clientesActivos },
          { count: totalPlanes },
          { count: asistenciasHoy }
        ] = await Promise.all([
          supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gimnasios.id),
          supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gimnasios.id)
            .eq('activo', true),
          supabase
            .from('planes')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gimnasios.id)
            .eq('activo', true),
          supabase
            .from('asistencias')
            .select('*', { count: 'exact', head: true })
            .eq('fecha', new Date().toISOString().split('T')[0])
            .in('cliente_id', 
              await supabase
                .from('clientes')
                .select('id')
                .eq('gimnasio_id', gimnasios.id)
                .then(res => res.data?.map(c => c.id) || [])
            )
        ])

        setStats({
          totalClientes: totalClientes || 0,
          clientesActivos: clientesActivos || 0,
          totalPlanes: totalPlanes || 0,
          asistenciasHoy: asistenciasHoy || 0
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClientes,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Clientes Activos',
      value: stats.clientesActivos,
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Planes Activos',
      value: stats.totalPlanes,
      icon: CreditCard,
      color: 'bg-purple-500'
    },
    {
      title: 'Asistencias Hoy',
      value: stats.asistenciasHoy,
      icon: Calendar,
      color: 'bg-yellow-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen de la actividad de tu gimnasio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${card.color} rounded-md p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {card.title}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Acciones Rápidas
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <a
                href="/dashboard/clientes"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Users className="mr-2 h-4 w-4" />
                Gestionar Clientes
              </a>
              <a
                href="/dashboard/asistencias"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Registrar Asistencia
              </a>
              <a
                href="/dashboard/planes"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Gestionar Planes
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Actividad Reciente
            </h3>
            <div className="mt-5">
              <p className="text-sm text-gray-500">
                Las últimas actividades aparecerán aquí...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}