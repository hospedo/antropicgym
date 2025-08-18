'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugCliente() {
  const [documento, setDocumento] = useState('33893368')
  const [clienteInfo, setClienteInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const buscarCliente = async () => {
    setLoading(true)
    try {
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select(`
          id,
          nombre,
          apellido,
          documento,
          email,
          activo,
          usuario_id,
          created_at,
          inscripciones (
            id,
            estado,
            fecha_inicio,
            fecha_fin,
            planes (
              nombre,
              precio
            )
          ),
          gimnasios (
            id,
            nombre
          )
        `)
        .eq('documento', documento)
        .single()

      if (error) {
        setClienteInfo({ error: error.message })
      } else {
        // Obtener asistencias
        const { data: asistencias } = await supabase
          .from('asistencias')
          .select('fecha, hora')
          .eq('cliente_id', cliente.id)
          .order('fecha', { ascending: false })
          .limit(10)

        // Obtener total de asistencias
        const { count: totalAsistencias } = await supabase
          .from('asistencias')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id)

        setClienteInfo({
          ...cliente,
          asistencias_recientes: asistencias,
          total_asistencias: totalAsistencias
        })
      }
    } catch (error) {
      setClienteInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const crearCodigoInvitacion = async () => {
    if (!clienteInfo || !clienteInfo.email) {
      alert('Cliente no encontrado o sin email')
      return
    }

    try {
      // Importar función para crear código
      const { crearCodigoParaCliente } = await import('@/lib/crear-codigo-invitacion')
      const resultado = await crearCodigoParaCliente(clienteInfo.id)

      if (resultado.success) {
        const mensaje = `✅ ${resultado.mensaje}

📋 DATOS PARA EL CLIENTE:
👤 Cliente: ${resultado.cliente.nombre} ${resultado.cliente.apellido}
📧 Email: ${resultado.cliente.email}
🔑 Código: ${resultado.codigo}
🌐 Link directo: ${window.location.origin}${resultado.linkRegistro}

El cliente puede usar este código en /auth/register-member`

        alert(mensaje)
        buscarCliente() // Recargar info
      } else {
        alert('Error: ' + resultado.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Cliente</h1>
        
        <div className="flex space-x-4 mb-6">
          <input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Número de documento"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={buscarCliente}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar Cliente'}
          </button>
        </div>

        {clienteInfo && (
          <div className="space-y-6">
            {clienteInfo.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-600">Error: {clienteInfo.error}</p>
              </div>
            ) : (
              <>
                {/* Info básica */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">Información Básica</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Nombre:</strong> {clienteInfo.nombre} {clienteInfo.apellido}</p>
                    <p><strong>Documento:</strong> {clienteInfo.documento}</p>
                    <p><strong>Email:</strong> {clienteInfo.email || 'Sin email'}</p>
                    <p><strong>Activo:</strong> {clienteInfo.activo ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Tiene cuenta:</strong> {clienteInfo.usuario_id ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Gimnasio:</strong> {clienteInfo.gimnasios.nombre}</p>
                  </div>
                </div>

                {/* Inscripciones */}
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">Inscripciones</h3>
                  {clienteInfo.inscripciones.length > 0 ? (
                    <div className="space-y-2">
                      {clienteInfo.inscripciones.map((inscripcion: any, index: number) => (
                        <div key={index} className="border border-blue-200 rounded p-3">
                          <p><strong>Plan:</strong> {inscripcion.planes.nombre}</p>
                          <p><strong>Estado:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              inscripcion.estado === 'activa' ? 'bg-green-100 text-green-800' :
                              inscripcion.estado === 'vencida' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {inscripcion.estado}
                            </span>
                          </p>
                          <p><strong>Período:</strong> {inscripcion.fecha_inicio} a {inscripcion.fecha_fin}</p>
                          <p><strong>Precio:</strong> ${inscripcion.planes.precio}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Sin inscripciones</p>
                  )}
                </div>

                {/* Asistencias */}
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">
                    Asistencias (Total: {clienteInfo.total_asistencias})
                  </h3>
                  {clienteInfo.asistencias_recientes?.length > 0 ? (
                    <div className="space-y-1">
                      {clienteInfo.asistencias_recientes.map((asistencia: any, index: number) => (
                        <p key={index} className="text-sm">
                          📅 {asistencia.fecha} a las {asistencia.hora}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Sin asistencias registradas</p>
                  )}
                </div>

                {/* Acciones */}
                {!clienteInfo.usuario_id && clienteInfo.email && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="font-bold text-yellow-800 mb-2">⚠️ Cliente sin cuenta</h3>
                    <p className="text-yellow-700 mb-3">
                      Este cliente no tiene cuenta de usuario. Para que aparezca en el AI Coach, necesita una cuenta.
                    </p>
                    <button
                      onClick={crearCodigoInvitacion}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      Generar Código de Invitación
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}