'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { detectarClientesAusentes, ejecutarChequeoAusencias, ClienteAusencia } from '@/lib/ai-coach'
import { generarMemeConIA, crearContenidoCompleto } from '@/lib/openai-content'
import { ejecutarDeteccionPositiva } from '@/lib/positive-content'
import { Bot, Play, Users, Zap, Calendar, MessageSquare, Image, Hash, Star } from 'lucide-react'

export default function AICoachDashboard() {
  const [gimnasioId, setGimnasioId] = useState<string>('')
  const [clientesAusentes, setClientesAusentes] = useState<ClienteAusencia[]>([])
  const [contenidoGenerado, setContenidoGenerado] = useState<any[]>([])
  const [contenidoPositivo, setContenidoPositivo] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generandoContenido, setGenerandoContenido] = useState<string | null>(null)

  useEffect(() => {
    const obtenerGimnasio = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: gimnasio } = await supabase
        .from('gimnasios')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (gimnasio) {
        setGimnasioId(gimnasio.id)
        await cargarClientesAusentes(gimnasio.id)
      }
    }

    obtenerGimnasio()
  }, [supabase])

  const cargarClientesAusentes = async (gymId: string) => {
    setLoading(true)
    try {
      const ausentes = await detectarClientesAusentes(gymId)
      setClientesAusentes(ausentes)
    } catch (error) {
      console.error('Error cargando clientes ausentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const generarContenidoParaCliente = async (cliente: ClienteAusencia) => {
    setGenerandoContenido(cliente.id)
    try {
      const contenido = await crearContenidoCompleto(cliente)
      
      // Guardar en base de datos
      await supabase
        .from('ai_content_generated')
        .insert({
          cliente_id: cliente.id,
          tipo_contenido: contenido.tipo,
          personalidad: contenido.personalidad,
          contenido_data: contenido
        })

      setContenidoGenerado(prev => [...prev, contenido])
      
    } catch (error) {
      console.error('Error generando contenido:', error)
    } finally {
      setGenerandoContenido(null)
    }
  }

  const ejecutarChequeoCompleto = async () => {
    setLoading(true)
    try {
      const contenido = await ejecutarChequeoAusencias(gimnasioId)
      setContenidoGenerado(contenido)
    } catch (error) {
      console.error('Error en chequeo automático:', error)
    } finally {
      setLoading(false)
    }
  }

  const ejecutarMantenimiento = async () => {
    setLoading(true)
    try {
      // Importar función de mantenimiento
      const { ejecutarMantenimientoClientes } = await import('@/lib/cliente-status')
      const resultado = await ejecutarMantenimientoClientes(gimnasioId)
      
      console.log('Mantenimiento ejecutado:', resultado)
      
      // Recargar clientes ausentes
      await cargarClientesAusentes(gimnasioId)
      
      // Mostrar resultados (opcional - puedes agregar un toast o modal)
      if (resultado.actualizaciones?.success && resultado.actualizaciones?.actualizaciones?.length > 0) {
        alert(`Se actualizaron ${resultado.actualizaciones?.actualizaciones?.length || 0} clientes`)
      } else {
        alert('Todos los estados están actualizados')
      }
    } catch (error) {
      console.error('Error en mantenimiento:', error)
      alert('Error ejecutando mantenimiento')
    } finally {
      setLoading(false)
    }
  }

  const ejecutarDeteccionPositivaCompleta = async () => {
    setLoading(true)
    try {
      const resultado = await ejecutarDeteccionPositiva(gimnasioId)
      if (resultado.success) {
        setContenidoPositivo(resultado.contenido || [])
        if (resultado.contenido?.length === 0) {
          alert(resultado.mensaje || 'No hay logros destacados hoy')
        }
      } else {
        console.error('Error en detección positiva:', resultado.error)
      }
    } catch (error) {
      console.error('Error ejecutando detección positiva:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!gimnasioId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Coach Viral</h1>
            <p className="text-purple-100">
              Genera contenido automático para clientes ausentes
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes Ausentes</p>
              <p className="text-2xl font-bold text-gray-900">{clientesAusentes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contenido Generado</p>
              <p className="text-2xl font-bold text-gray-900">{contenidoGenerado.length + contenidoPositivo.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <button
            onClick={ejecutarChequeoCompleto}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loading ? 'Procesando...' : 'Ejecutar AI Coach'}</span>
          </button>
          <button
            onClick={ejecutarMantenimiento}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            <span>{loading ? 'Actualizando...' : 'Actualizar Estados'}</span>
          </button>
          <button
            onClick={ejecutarDeteccionPositivaCompleta}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <Star className="h-4 w-4" />
            <span>{loading ? 'Detectando...' : 'Detectar Logros'}</span>
          </button>
        </div>
      </div>

      {/* Clientes Ausentes */}
      {clientesAusentes.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-600" />
              Clientes Ausentes ({clientesAusentes.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {clientesAusentes.map((cliente) => (
                <div key={cliente.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {cliente.nombre} {cliente.apellido}
                        </h3>
                        {cliente.razon_problema === 'plan_vencido' && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Plan Vencido
                          </span>
                        )}
                        {cliente.razon_problema === 'cliente_inactivo' && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                        {!cliente.cliente_activo && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Sin Cuenta
                          </span>
                        )}
                        {cliente.razon_problema === 'ausencia' && (
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Ausente
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>
                          {cliente.dias_sin_venir} días sin venir
                          {cliente.ultima_asistencia && (
                            <span className="ml-2">
                              (Última: {new Date(cliente.ultima_asistencia).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs ${cliente.plan_activo ? 'text-green-600' : 'text-red-600'}`}>
                            {cliente.plan_activo ? '✅ Plan Activo' : '❌ Sin Plan Activo'}
                          </span>
                          <span className={`text-xs ${cliente.cliente_activo ? 'text-green-600' : 'text-gray-600'}`}>
                            {cliente.cliente_activo ? '✅ Cliente Activo' : '⚪ Cliente Inactivo'}
                          </span>
                          <span className={`text-xs ${cliente.usuario_id ? 'text-blue-600' : 'text-gray-500'}`}>
                            {cliente.usuario_id ? '🔑 Con Cuenta' : '👤 Sin Cuenta'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => generarContenidoParaCliente(cliente)}
                      disabled={generandoContenido === cliente.id}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                        cliente.razon_problema === 'plan_vencido' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                      <span>
                        {generandoContenido === cliente.id ? 'Generando...' : 'Generar Contenido'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido Generado */}
      {contenidoGenerado.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              Contenido Viral Generado ({contenidoGenerado.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-6">
              {contenidoGenerado.map((contenido, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{contenido.titulo}</h3>
                      <p className="text-sm text-purple-600 font-medium">{contenido.personalidad}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {contenido.tipo}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700">{contenido.descripcion}</p>
                    </div>
                    
                    {contenido.imagen_url && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <Image className="h-4 w-4" />
                          <span>Imagen generada por IA</span>
                        </div>
                        <img 
                          src={contenido.imagen_url} 
                          alt={contenido.titulo}
                          className="max-w-sm rounded-lg border"
                        />
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Hash className="h-4 w-4" />
                        <span>Hashtags</span>
                      </div>
                      <p className="text-blue-600">{contenido.hashtags?.join(' ')}</p>
                    </div>
                    
                    {contenido.texto_final && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Listo para publicar:</h4>
                        <p className="text-green-700 whitespace-pre-line">{contenido.texto_final}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido Positivo Generado */}
      {contenidoPositivo.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              Contenido de Celebración ({contenidoPositivo.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-6">
              {contenidoPositivo.map((contenido, index) => (
                <div key={index} className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{contenido.titulo}</h3>
                      <p className="text-sm text-yellow-600 font-medium flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {contenido.tipo_logro} - {contenido.personalidad}
                      </p>
                    </div>
                    <span className="bg-yellow-500 text-white text-xs font-medium px-2.5 py-0.5 rounded">
                      🎉 CELEBRACIÓN
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700">{contenido.descripcion}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Hash className="h-4 w-4" />
                        <span>Hashtags para redes sociales</span>
                      </div>
                      <p className="text-yellow-600 font-medium">{contenido.hashtags?.join(' ')}</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Listo para publicar:
                      </h4>
                      <p className="text-green-700 whitespace-pre-line">
                        {contenido.descripcion}
                        {'\n\n'}
                        {contenido.hashtags?.join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado sin datos */}
      {!loading && clientesAusentes.length === 0 && contenidoPositivo.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Excelente! Todos tus miembros están activos
          </h3>
          <p className="text-gray-600">
            No hay clientes ausentes para generar contenido viral
          </p>
        </div>
      )}
    </div>
  )
}