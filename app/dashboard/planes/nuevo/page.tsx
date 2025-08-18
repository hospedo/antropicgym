'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PlanInsert } from '@/types'

export default function NuevoPlanPage() {
  const [formData, setFormData] = useState<Partial<PlanInsert>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion_dias: 30,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!gimnasio) throw new Error('Gimnasio no encontrado')

      const { error: insertError } = await supabase
        .from('planes')
        .insert({
          ...formData,
          gimnasio_id: gimnasio.id
        } as PlanInsert)

      if (insertError) throw insertError

      router.push('/dashboard/planes')
    } catch (err: any) {
      setError(err.message || 'Error al crear el plan')
    } finally {
      setLoading(false)
    }
  }

  const presetPlans = [
    { nombre: 'Plan Básico', precio: 30, duracion: 30, descripcion: 'Acceso completo al gimnasio' },
    { nombre: 'Plan Mensual', precio: 50, duracion: 30, descripcion: 'Acceso completo + clases grupales' },
    { nombre: 'Plan Trimestral', precio: 120, duracion: 90, descripcion: 'Acceso completo + entrenador personal' },
    { nombre: 'Plan Anual', precio: 400, duracion: 365, descripcion: 'Acceso completo + todos los beneficios' }
  ]

  const fillPreset = (preset: typeof presetPlans[0]) => {
    setFormData(prev => ({
      ...prev,
      nombre: preset.nombre,
      precio: preset.precio,
      duracion_dias: preset.duracion,
      descripcion: preset.descripcion
    }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Plan</h1>
        <p className="mt-1 text-sm text-gray-600">
          Crea un nuevo plan de entrenamiento para tu gimnasio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-2">
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
                  placeholder="Ej: Plan Mensual Premium"
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
                  placeholder="Describe qué incluye este plan..."
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
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Plantillas predefinidas */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Plantillas Rápidas
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Haz clic en una plantilla para llenar automáticamente el formulario
            </p>
            <div className="space-y-3">
              {presetPlans.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillPreset(preset)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{preset.nombre}</div>
                  <div className="text-sm text-gray-600">
                    ${preset.precio} - {preset.duracion} días
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {preset.descripcion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}