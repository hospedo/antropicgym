'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TestLogin() {
  const [status, setStatus] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setStatus(`Session check: ${error ? error.message : 'OK'}`)
      setUser(session?.user || null)
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }

  const testLogin = async () => {
    try {
      setStatus('Intentando login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com', // Cambia por tu email de test
        password: 'test123'     // Cambia por tu password de test
      })

      if (error) {
        setStatus(`Error login: ${error.message}`)
      } else {
        setStatus('Login exitoso!')
        setUser(data.user)
      }
    } catch (error) {
      setStatus(`Error inesperado: ${error.message}`)
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test de Login</h1>
        
        <div className="space-y-4">
          <button
            onClick={checkSession}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Verificar Sesión Actual
          </button>

          <button
            onClick={testLogin}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Test Login
          </button>

          <button
            onClick={goToDashboard}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Ir a Dashboard
          </button>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Status:</h3>
            <p>{status}</p>
          </div>

          {user && (
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-bold">Usuario:</h3>
              <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}

          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-bold">URLs de Test:</h3>
            <p><a href="/auth/login" className="text-blue-600 underline">/auth/login</a></p>
            <p><a href="/dashboard" className="text-blue-600 underline">/dashboard</a></p>
            <p><a href="/debug" className="text-blue-600 underline">/debug</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}