'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cliente, Inscripcion, PagoInsert } from '@/types'
import { getBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresISOString } from '@/lib/timezone-utils'

interface InscripcionConPlan extends Inscripcion {
  plan: { nombre: string; precio: number }
}

export default function NuevoPagoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [inscripciones, setInscripciones] = useState<InscripcionConPlan[]>([])
  const [formData, setFormData] = useState<Partial<PagoInsert>>({
    cliente_id: '',
    inscripcion_id: '',
    monto: 0,
    metodo_pago: 'efectivo',
    fecha_pago: getBuenosAiresDateString(),
    observaciones: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

        const { data: clientesData } = await supabase
          .from('clientes')
          .select('*')
          .eq('gimnasio_id', gimnasio.id)
          .eq('activo', true)
          .order('nombre')

        setClientes(clientesData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadInscripciones = async () => {
      if (!formData.cliente_id) {
        setInscripciones([])
        return
      }

      try {
        const { data: inscripcionesData } = await supabase
          .from('inscripciones')
          .select(`
            *,
            plan:planes (nombre, precio)
          `)
          .eq('cliente_id', formData.cliente_id)
          .eq('estado', 'activa')

        setInscripciones(inscripcionesData || [])
        
        // Auto-llenar el monto con el precio del primer plan
        if (inscripcionesData && inscripcionesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            inscripcion_id: inscripcionesData[0].id,
            monto: inscripcionesData[0].plan.precio
          }))
        }
      } catch (error) {
        console.error('Error loading inscriptions:', error)
      }
    }

    loadInscripciones()
  }, [formData.cliente_id])

  const handleClienteChange = (clienteId: string) => {
    setFormData(prev => ({
      ...prev,
      cliente_id: clienteId,
      inscripcion_id: '',
      monto: 0
    }))
  }

  const handleInscripcionChange = (inscripcionId: string) => {
    const inscripcion = inscripciones.find(i => i.id === inscripcionId)
    setFormData(prev => ({
      ...prev,
      inscripcion_id: inscripcionId,
      monto: inscripcion ? inscripcion.plan.precio : 0
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!formData.cliente_id || !formData.inscripcion_id) {
        throw new Error('Cliente e inscripción son requeridos')
      }

      const { error: insertError } = await supabase
        .from('pagos')
        .insert(formData as PagoInsert)

      if (insertError) throw insertError

      router.push('/dashboard/pagos')
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago')
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
        <h1 className="text-2xl font-bold text-gray-900">Registrar Pago</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registra un nuevo pago de membresía
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
                Cliente *
              </label>
              <select
                id="cliente_id"
                name="cliente_id"
                value={formData.cliente_id || ''}
                onChange={(e) => handleClienteChange(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inscripcion_id" className="block text-sm font-medium text-gray-700">
                Plan/Inscripción *
              </label>
              <select
                id="inscripcion_id"
                name="inscripcion_id"
                value={formData.inscripcion_id || ''}
                onChange={(e) => handleInscripcionChange(e.target.value)}
                required
                disabled={!formData.cliente_id}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Selecciona una inscripción</option>
                {inscripciones.map((inscripcion) => (
                  <option key={inscripcion.id} value={inscripcion.id}>
                    {inscripcion.plan.nombre} - ${inscripcion.plan.precio}
                  </option>
                ))}
              </select>
              {formData.cliente_id && inscripciones.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  Este cliente no tiene inscripciones activas
                </p>
              )}
            </div>

            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700">
                Monto ($) *
              </label>
              <input
                type="number"
                id="monto"
                name="monto"
                step="0.01"
                min="0"
                value={formData.monto || 0}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="metodo_pago" className="block text-sm font-medium text-gray-700">
                Método de Pago *
              </label>
              <select
                id="metodo_pago"
                name="metodo_pago"
                value={formData.metodo_pago || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700">
                Fecha de Pago *
              </label>
              <input
                type="date"
                id="fecha_pago"
                name="fecha_pago"
                value={formData.fecha_pago || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              value={formData.observaciones || ''}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales sobre el pago..."
            />
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
              {saving ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}