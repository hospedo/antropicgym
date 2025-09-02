'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugGimnasio() {
  const [gimnasioInfo, setGimnasioInfo] = useState<any>(null)
  const [tablaEstructura, setTablaEstructura] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const debug = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Usuario no autenticado')
          return
        }

        console.log('Usuario:', user.id)

        // Obtener estructura completa de tabla gimnasios
        const { data: allGimnasios, error: allError } = await supabase
          .from('gimnasios')
          .select('*')

        console.log('Todos los gimnasios:', allGimnasios)
        console.log('Error al obtener gimnasios:', allError)

        if (allGimnasios && allGimnasios.length > 0) {
          console.log('Columnas disponibles:', Object.keys(allGimnasios[0]))
          setTablaEstructura(Object.keys(allGimnasios[0]))
        }

        // Buscar gimnasio del usuario actual
        const gimnasioUsuario = allGimnasios?.find(g => g.usuario_id === user.id)
        if (gimnasioUsuario) {
          setGimnasioInfo(gimnasioUsuario)
          console.log('Gimnasio del usuario:', gimnasioUsuario)
        } else {
          setError('No se encontró gimnasio para este usuario')
        }

      } catch (error: any) {
        console.error('Error en debug:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    debug()
  }, [])

  if (loading) {
    return <div className="p-8">Cargando debug...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Gimnasio</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white border rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Columnas disponibles en tabla gimnasios:</h2>
        <div className="grid grid-cols-3 gap-2">
          {tablaEstructura.map(columna => (
            <div key={columna} className="bg-gray-100 p-2 rounded text-sm">
              {columna}
            </div>
          ))}
        </div>
      </div>

      {gimnasioInfo && (
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Información del gimnasio:</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {gimnasioInfo.id}</p>
            <p><strong>Nombre:</strong> {gimnasioInfo.nombre}</p>
            <p><strong>Usuario ID:</strong> {gimnasioInfo.usuario_id}</p>
          </div>

          <h3 className="text-md font-semibold mt-6 mb-4">Campos de recepcionistas:</h3>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">Recepcionista {num}:</h4>
                <p className="text-sm">
                  <strong>Nombre:</strong> {gimnasioInfo[`recepcionista_${num}_nombre`] || 'No configurado'}
                </p>
                <p className="text-sm">
                  <strong>Password:</strong> {gimnasioInfo[`recepcionista_${num}_password`] || 'No configurado'}
                </p>
              </div>
            ))}
          </div>

          <h3 className="text-md font-semibold mt-6 mb-4">Datos completos (JSON):</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(gimnasioInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}