'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ClienteInsert, Plan } from '@/types'

export default function NuevoClientePage() {
  const [formData, setFormData] = useState<Partial<ClienteInsert>>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
    activo: true
  })
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
          .eq('activo', true)
          .order('nombre')

        setPlanes(planesData || [])
      } catch (error) {
        console.error('Error loading plans:', error)
      }
    }

    loadPlanes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validar campos obligatorios
    if (!formData.nombre?.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }
    if (!formData.apellido?.trim()) {
      setError('El apellido es obligatorio')
      setLoading(false)
      return
    }
    if (!formData.documento?.trim()) {
      setError('El DNI es obligatorio')
      setLoading(false)
      return
    }
    if (!formData.telefono?.trim()) {
      setError('El teléfono es obligatorio')
      setLoading(false)
      return
    }

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

      const { data: clienteData, error: insertError } = await supabase
        .from('clientes')
        .insert({
          ...formData,
          gimnasio_id: gimnasio.id
        } as ClienteInsert)
        .select()
        .single()

      if (insertError) throw insertError

      // Si se seleccionó un plan, crear la inscripción
      if (selectedPlan && clienteData) {
        const planSeleccionado = planes.find(p => p.id === selectedPlan)
        if (planSeleccionado) {
          const fechaInicio = new Date()
          const fechaVencimiento = new Date()
          fechaVencimiento.setDate(fechaInicio.getDate() + planSeleccionado.duracion_dias)

          const { error: inscripcionError } = await supabase
            .from('inscripciones')
            .insert({
              cliente_id: clienteData.id,
              plan_id: selectedPlan,
              gimnasio_id: gimnasio.id,
              fecha_inicio: fechaInicio.toISOString(),
              fecha_vencimiento: fechaVencimiento.toISOString(),
              estado: 'activa' as const,
              precio: planSeleccionado.precio
            })

          if (inscripcionError) {
            console.error('Error creating subscription:', inscripcionError)
          }
        }
      }

      router.push('/dashboard/clientes')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
        <p className="mt-1 text-sm text-gray-600">
          Completa la información del nuevo cliente
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                value={formData.nombre || ''}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                id="apellido"
                required
                value={formData.apellido || ''}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
                DNI *
              </label>
              <input
                type="text"
                name="documento"
                id="documento"
                required
                value={formData.documento || ''}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                id="telefono"
                required
                value={formData.telefono || ''}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (opcional)
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ Sin email no recibirás promociones ni notificaciones futuras
            </p>
          </div>

          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
              Plan (opcional)
            </label>
            <select
              name="plan"
              id="plan"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin plan</option>
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} - ${plan.precio} ({plan.duracion_dias} días)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Si seleccionas un plan, se creará automáticamente una inscripción activa para el cliente
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}