'use client'

import { useState } from 'react'
import { Crown, User, CheckCircle, AlertCircle } from 'lucide-react'

export default function ActivatePilotPage() {
  const [email, setEmail] = useState('lucas.coria@gmail.com') // Email predeterminado
  const [unlimited, setUnlimited] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleActivate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/admin/activate-pilot-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          unlimited
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Error desconocido')
      }

    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/admin/activate-pilot-plan?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
        method: 'GET'
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: 'Estado de suscripción obtenido',
          subscription: data.subscription
        })
      } else {
        setError(data.error || 'Error desconocido')
      }

    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Crown className="mr-3 h-8 w-8" />
              Activar Plan Piloto - Lucas Coria
            </h1>
            <p className="text-purple-100 mt-1">
              Programa piloto con acceso ilimitado y gratuito
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email del usuario
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lucas.coria@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="unlimited"
                  checked={unlimited}
                  onChange={(e) => setUnlimited(e.target.checked)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="unlimited" className="text-sm text-gray-700">
                  Plan completamente ilimitado (999,999 usuarios)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-4">
              <button
                onClick={handleActivate}
                disabled={loading || !email.trim()}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                <Crown className="mr-2 h-5 w-5" />
                {loading ? 'Activando...' : 'Activar Plan Piloto'}
              </button>

              <button
                onClick={handleCheck}
                disabled={loading || !email.trim()}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                <User className="mr-2 h-5 w-5" />
                {loading ? 'Consultando...' : 'Verificar Estado'}
              </button>
            </div>

            {/* Resultado exitoso */}
            {result && result.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">
                    {result.message}
                  </h3>
                </div>
                
                {result.details && (
                  <div className="mt-3 text-sm text-green-700">
                    <ul className="space-y-1">
                      <li><strong>Usuario:</strong> {result.details.usuario}</li>
                      <li><strong>Gimnasio:</strong> {result.details.gimnasio}</li>
                      <li><strong>Plan:</strong> {result.details.plan}</li>
                      <li><strong>Usuarios máximos:</strong> {result.details.usuarios_maximos}</li>
                      <li><strong>Costo:</strong> {result.details.costo}</li>
                    </ul>
                  </div>
                )}

                {result.subscription && (
                  <div className="mt-3 text-sm text-green-700">
                    <ul className="space-y-1">
                      <li><strong>Estado:</strong> {result.subscription.status}</li>
                      <li><strong>Tipo de plan:</strong> {result.subscription.plan_type}</li>
                      <li><strong>Usuarios máximos:</strong> {result.subscription.max_users}</li>
                      <li><strong>Precio por usuario:</strong> ${result.subscription.price_per_user}</li>
                      <li><strong>Válido hasta:</strong> {new Date(result.subscription.subscription_end_date).toLocaleDateString()}</li>
                      <li><strong>Es piloto:</strong> {result.subscription.is_pilot ? '✅ Sí' : '❌ No'}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                </div>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Información del programa piloto:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Plan completamente gratuito por 10 años</li>
                <li>• Acceso a todas las funcionalidades premium</li>
                <li>• {unlimited ? 'Usuarios completamente ilimitados' : 'Hasta 100 usuarios'}</li>
                <li>• Sin restricciones de funcionalidad</li>
                <li>• Soporte prioritario como gimnasio piloto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}