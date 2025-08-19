'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState('Verificando...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Verificar conexión básica a Supabase
        const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true })
        
        if (error) {
          setConnectionStatus('Error de conexión')
          setError(error.message)
        } else {
          setConnectionStatus('Conexión exitosa')
        }

        // Verificar sesión actual
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
        }
      } catch (err) {
        setConnectionStatus('Error inesperado')
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    }

    checkConnection()
  }, [])

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'test123'
      })
      
      if (error) {
        setError('Error de login: ' + error.message)
      } else {
        setUser(data.user)
        setError('')
      }
    } catch (err) {
      setError('Error inesperado en login: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Debug - Estado del Sistema</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Estado de Conexión a Supabase:</h3>
            <p className={`${connectionStatus === 'Conexión exitosa' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Variables de Entorno:</h3>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'}</p>
            <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'}</p>
          </div>

          <div>
            <h3 className="font-semibold">Usuario Actual:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {user ? JSON.stringify(user, null, 2) : 'No hay usuario logueado'}
            </pre>
          </div>

          {error && (
            <div>
              <h3 className="font-semibold text-red-600">Error:</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              onClick={testLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Login (test@test.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}