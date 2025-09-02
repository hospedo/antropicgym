'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cliente, ClienteUpdate } from '@/types'

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

  useEffect(() => {
    const loadCliente = async () => {
      try {
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
        }
      } catch (error) {
        console.error('Error loading client:', error)
        setError('Error al cargar los datos del cliente')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadCliente()
  }, [id])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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