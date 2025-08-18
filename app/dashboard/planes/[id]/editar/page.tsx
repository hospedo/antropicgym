'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plan, PlanUpdate } from '@/types'

export default function EditarPlanPage() {
  const { id } = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<PlanUpdate>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion_dias: 30,
    activo: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const { data: plan } = await supabase
          .from('planes')
          .select('*')
          .eq('id', id)
          .single()

        if (plan) {
          setFormData({
            nombre: plan.nombre,
            descripcion: plan.descripcion,
            precio: plan.precio,
            duracion_dias: plan.duracion_dias,
            activo: plan.activo
          })
        }
      } catch (error) {
        console.error('Error loading plan:', error)
        setError('Error al cargar el plan')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadPlan()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? Number(value)
        : type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('planes')
        .update(formData)
        .eq('id', id)

      if (updateError) throw updateError

      router.push('/dashboard/planes')
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el plan')
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
        <h1 className="text-2xl font-bold text-gray-900">Editar Plan</h1>
        <p className="mt-1 text-sm text-gray-600">
          Modifica los detalles del plan de entrenamiento
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre del Plan *
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
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="descripcion"
              id="descripcion"
              rows={3}
              value={formData.descripcion || ''}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
                Precio ($) *
              </label>
              <input
                type="number"
                name="precio"
                id="precio"
                required
                min="0"
                step="0.01"
                value={formData.precio || 0}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="duracion_dias" className="block text-sm font-medium text-gray-700">
                Duración (días) *
              </label>
              <select
                name="duracion_dias"
                id="duracion_dias"
                value={formData.duracion_dias || 30}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>1 Semana (7 días)</option>
                <option value={15}>2 Semanas (15 días)</option>
                <option value={30}>1 Mes (30 días)</option>
                <option value={60}>2 Meses (60 días)</option>
                <option value={90}>3 Meses (90 días)</option>
                <option value={180}>6 Meses (180 días)</option>
                <option value={365}>1 Año (365 días)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
              Plan activo (disponible para nuevas inscripciones)
            </label>
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
              {saving ? 'Guardando...' : 'Actualizar Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}