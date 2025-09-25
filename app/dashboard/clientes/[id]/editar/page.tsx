'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cliente, ClienteUpdate } from '@/types'
import { formatDateSafe, isMembershipActive } from '@/lib/date-utils'

export default function EditarClientePage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [formData, setFormData] = useState<Partial<ClienteUpdate>>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
    activo: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [planes, setPlanes] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Cargar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single()

        if (cliente) {
          setFormData({
            nombre: cliente.nombre || '',
            apellido: cliente.apellido || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            documento: cliente.documento || '',
            activo: cliente.activo ?? true
          })

          // Cargar inscripciones del cliente
          const { data: inscripcionesData } = await supabase
            .from('inscripciones')
            .select(`
              *,
              planes (
                nombre,
                precio,
                duracion_dias
              )
            `)
            .eq('cliente_id', id)
            .order('fecha_inicio', { ascending: false })

          setInscripciones(inscripcionesData || [])
        }

        // Cargar planes disponibles del gimnasio
        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (gimnasio) {
          const { data: planesData } = await supabase
            .from('planes')
            .select('*')
            .eq('gimnasio_id', gimnasio.id)
            .eq('activo', true)

          setPlanes(planesData || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadData()
  }, [id])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const asignarPlan = async () => {
    if (!selectedPlan) {
      setError('Selecciona un plan')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!gimnasio) {
        setError('Gimnasio no encontrado')
        return
      }

      const planSeleccionado = planes.find(p => p.id === selectedPlan)
      if (!planSeleccionado) {
        setError('Plan no encontrado')
        return
      }

      const fechaInicioDate = new Date(fechaInicio)
      const fechaVencimiento = new Date(fechaInicioDate)
      fechaVencimiento.setDate(fechaInicioDate.getDate() + planSeleccionado.duracion_dias)

      const { error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert({
          cliente_id: id,
          plan_id: selectedPlan,
          fecha_inicio: fechaInicioDate.toISOString().split('T')[0],
          fecha_fin: fechaVencimiento.toISOString().split('T')[0],
          estado: 'activa',
          monto_pagado: planSeleccionado.precio
        })

      if (inscripcionError) throw inscripcionError

      // Recargar inscripciones
      const { data: inscripcionesData } = await supabase
        .from('inscripciones')
        .select(`
          *,
          planes (
            nombre,
            precio,
            duracion_dias
          )
        `)
        .eq('cliente_id', id)
        .order('fecha_inicio', { ascending: false })

      setInscripciones(inscripcionesData || [])
      setSelectedPlan('')
      setFechaInicio(new Date().toISOString().split('T')[0])
      alert('Plan asignado exitosamente')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al asignar el plan')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validar campos obligatorios
    if (!formData.nombre?.trim()) {
      setError('El nombre es obligatorio')
      setSaving(false)
      return
    }
    if (!formData.apellido?.trim()) {
      setError('El apellido es obligatorio')
      setSaving(false)
      return
    }
    if (!formData.documento?.trim()) {
      setError('El DNI es obligatorio')
      setSaving(false)
      return
    }
    if (!formData.telefono?.trim()) {
      setError('El teléfono es obligatorio')
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('clientes')
        .update(formData)
        .eq('id', id)

      if (updateError) throw updateError

      router.push(`/dashboard/clientes/${id}`)
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente')
    } finally {
      setSaving(false)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
        <p className="mt-1 text-sm text-gray-600">
          Modifica la información del cliente
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

          {/* Membresías/Inscripciones */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Membresías</h3>
            
            {/* Inscripciones existentes */}
            {inscripciones.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Historial de membresías:</h4>
                <div className="space-y-2">
                  {inscripciones.map((inscripcion) => {
                    // Debug: verificar fecha
                    console.log('Debug fecha:', { fecha_fin: inscripcion.fecha_fin, typeof: typeof inscripcion.fecha_fin })
                    
                    // Manejo seguro de fecha inline
                    let fechaFormateada = '⚠️ Fecha inválida'
                    let fechaValida = false
                    
                    if (inscripcion.fecha_fin) {
                      try {
                        const fecha = new Date(inscripcion.fecha_fin)
                        if (!isNaN(fecha.getTime())) {
                          fechaFormateada = fecha.toLocaleDateString()
                          fechaValida = true
                        }
                      } catch (error) {
                        console.log('Error parseando fecha:', error)
                      }
                    }
                    
                    const esActiva = inscripcion.estado === 'activa' && fechaValida && new Date(inscripcion.fecha_fin) >= new Date()
                    const esError = !fechaValida
                    
                    return (
                      <div
                        key={inscripcion.id}
                        className={`p-3 rounded-lg border ${
                          esActiva 
                            ? 'bg-green-50 border-green-200' 
                            : esError
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {inscripcion.planes?.nombre || 'Plan eliminado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vence: {fechaFormateada}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              esError
                                ? 'bg-red-100 text-red-800'
                                : esActiva
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {esError ? 'ERROR' : esActiva ? 'ACTIVA' : 'VENCIDA'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Asignar nuevo plan */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asignar nuevo plan:</h4>
              
              <div className="space-y-3">
                {/* Fecha de inicio */}
                <div>
                  <label htmlFor="fechaInicio" className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha de inicio del plan:
                  </label>
                  <input
                    type="date"
                    id="fechaInicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Ajusta la fecha si el cliente pagó en otra fecha
                  </p>
                </div>

                {/* Selector de plan */}
                <div className="flex space-x-3">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar plan...</option>
                    {planes.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre} - ${plan.precio} ({plan.duracion_dias} días)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={asignarPlan}
                    disabled={!selectedPlan || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>

                {/* Mostrar fecha de vencimiento calculada */}
                {selectedPlan && (
                  <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                    <span className="font-medium">Fecha de vencimiento: </span>
                    {(() => {
                      const planSeleccionado = planes.find(p => p.id === selectedPlan)
                      if (planSeleccionado && fechaInicio) {
                        const inicioDate = new Date(fechaInicio)
                        const vencimientoDate = new Date(inicioDate)
                        vencimientoDate.setDate(inicioDate.getDate() + planSeleccionado.duracion_dias)
                        return vencimientoDate.toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      }
                      return 'Selecciona un plan'
                    })()}
                  </div>
                )}
              </div>

              {planes.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No hay planes disponibles. Crea planes en la sección de Planes.
                </p>
              )}
            </div>
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
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}