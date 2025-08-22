'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BugReport } from '@/types'
import { Bug, AlertCircle, Lightbulb, Send, CheckCircle, Clock, X } from 'lucide-react'

export default function ReportarBugPage() {
  const [formData, setFormData] = useState({
    tipo: 'bug' as 'bug' | 'recomendacion' | 'mejora',
    titulo: '',
    descripcion: '',
    pagina_url: '',
    navegador: ''
  })
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [gimnasioId, setGimnasioId] = useState<string>('')

  useEffect(() => {
    const initData = async () => {
      // Obtener información del navegador
      const userAgent = navigator.userAgent
      setFormData(prev => ({ 
        ...prev, 
        navegador: userAgent,
        pagina_url: window.location.href 
      }))

      // Obtener gimnasio del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: gimnasio } = await supabase
          .from('gimnasios')
          .select('id')
          .eq('usuario_id', user.id)
          .single()
        
        if (gimnasio) {
          setGimnasioId(gimnasio.id)
        }

        // Cargar reportes previos
        await loadReports(user.id)
      }
    }

    initData()
  }, [])

  const loadReports = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err: any) {
      console.error('Error cargando reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('Título y descripción son obligatorios')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { error } = await supabase
        .from('bug_reports')
        .insert({
          usuario_id: user.id,
          gimnasio_id: gimnasioId || null,
          tipo: formData.tipo,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          pagina_url: formData.pagina_url,
          navegador: formData.navegador
        })

      if (error) throw error

      setMessage('¡Reporte enviado exitosamente! Gracias por tu feedback.')
      setFormData({
        tipo: 'bug',
        titulo: '',
        descripcion: '',
        pagina_url: window.location.href,
        navegador: navigator.userAgent
      })

      // Recargar reportes
      await loadReports(user.id)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000)

    } catch (err: any) {
      setError(err.message || 'Error al enviar el reporte')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'bug': return <Bug className="h-5 w-5 text-red-600" />
      case 'recomendacion': return <Lightbulb className="h-5 w-5 text-yellow-600" />
      case 'mejora': return <AlertCircle className="h-5 w-5 text-blue-600" />
      default: return <Bug className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'en_revision': return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'solucionado': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'descartado': return <X className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'en_revision': return 'bg-blue-100 text-blue-800'
      case 'solucionado': return 'bg-green-100 text-green-800'
      case 'descartado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportar Bug o Recomendación</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ayúdanos a mejorar la plataforma reportando errores o enviando sugerencias
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de reporte */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de reporte *
            </label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bug">🐛 Bug (Error o problema)</option>
              <option value="recomendacion">💡 Recomendación (Sugerencia)</option>
              <option value="mejora">🚀 Mejora (Nueva funcionalidad)</option>
            </select>
          </div>

          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe brevemente el problema o sugerencia"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción detallada *
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              rows={4}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explica en detalle el problema, pasos para reproducirlo, o tu sugerencia de mejora"
            />
          </div>

          {/* URL de la página */}
          <div>
            <label htmlFor="pagina_url" className="block text-sm font-medium text-gray-700 mb-2">
              URL de la página (opcional)
            </label>
            <input
              type="url"
              id="pagina_url"
              name="pagina_url"
              value={formData.pagina_url}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Información del navegador */}
          <div>
            <label htmlFor="navegador" className="block text-sm font-medium text-gray-700 mb-2">
              Información del navegador
            </label>
            <textarea
              id="navegador"
              name="navegador"
              value={formData.navegador}
              onChange={handleChange}
              rows={2}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs"
              readOnly
            />
          </div>

          {/* Mensajes */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Botón enviar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>

      {/* Reportes anteriores */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Mis reportes anteriores</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No has enviado reportes anteriormente</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(report.tipo)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{report.titulo}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(report.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.estado)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.estado)}`}>
                      {report.estado.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}