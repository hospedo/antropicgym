'use client'

import { useState } from 'react'
import { useSubscription, activateSubscription } from '@/lib/use-subscription'
import { CheckCircle, CreditCard, Clock, Crown, AlertCircle, Shield, X } from 'lucide-react'

export default function SuscripcionPage() {
  const { hasAccess, isTrialActive, daysRemaining, subscription, loading } = useSubscription()
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const currentPlan = subscription?.status === 'active' ? 'basico' : 'gratuito'

  const handleUpgrade = async () => {
    setProcessing(true)
    setError('')
    setMessage('')

    try {
      // Aquí integrarías con tu proveedor de pagos (MercadoPago, Stripe, etc.)
      // Por ahora simularemos el proceso
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simular proceso de pago
      
      const result = await activateSubscription(subscription?.usuario_id || '', paymentMethod)
      
      if (result.success) {
        setMessage('¡Upgrade exitoso! Ahora tienes acceso al Plan Básico de ANTROPIC.')
        // Recargar página después de 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(result.error || 'Error al procesar el upgrade')
      }
    } catch (err: any) {
      setError('Error al procesar el pago')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Planes de suscripción</h1>
        <p className="mt-2 text-lg text-gray-600">
          Elige el plan que mejor se adapte a tu gimnasio
        </p>
      </div>

      {/* Planes */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* Plan Gratuito */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative ${
          currentPlan === 'gratuito' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        }`}>
          {currentPlan === 'gratuito' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                📍 Plan Actual
              </span>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Gratuito</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-600 ml-2">/mes</span>
            </div>
            <p className="text-green-600 font-semibold">
              ✨ 30 días de prueba
            </p>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>Gestión básica de clientes</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>Control de asistencias</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>Gestión de planes básicos</span>
            </li>
            <li className="flex items-center text-gray-400">
              <X className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>AI Coach Viral (limitado)</span>
            </li>
            <li className="flex items-center text-gray-400">
              <X className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Analytics avanzados</span>
            </li>
            <li className="flex items-center text-gray-400">
              <X className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Integración WhatsApp</span>
            </li>
          </ul>
          
          {currentPlan === 'gratuito' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {isTrialActive ? `Te quedan ${daysRemaining} días de prueba` : 'Prueba expirada'}
                  </p>
                  {isTrialActive && (
                    <p className="text-xs text-blue-600">
                      Aprovecha todas las funciones antes de que expire
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
          >
            {currentPlan === 'gratuito' ? 'Plan Actual' : 'No Disponible'}
          </button>
        </div>

        {/* Plan Básico */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative ${
          currentPlan === 'basico' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
        }`}>
          {currentPlan === 'basico' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                👑 Plan Actual
              </span>
            </div>
          )}
          
          {currentPlan === 'gratuito' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                🚀 Recomendado
              </span>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Básico</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-purple-600">$150</span>
              <span className="text-gray-600 ml-2">/usuario/mes</span>
            </div>
            <p className="text-purple-600 font-semibold">
              🔥 Acceso completo
            </p>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>🤖 AI Coach Viral ilimitado</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>👥 Gestión completa de clientes</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>📊 Analytics avanzados</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>💳 Control de pagos</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>📱 Integración WhatsApp</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>🛡️ Soporte prioritario</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span>🔄 Actualizaciones automáticas</span>
            </li>
          </ul>
          
          {currentPlan === 'basico' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Suscripción activa</p>
                  <p className="text-xs text-green-600">
                    Próximo pago: {subscription?.next_billing_date 
                      ? new Date(subscription.next_billing_date).toLocaleDateString('es-ES')
                      : 'No programado'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Método de pago */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Método de pago</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">💳 Tarjeta</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="mercadopago"
                      checked={paymentMethod === 'mercadopago'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">🇦🇷 MercadoPago</span>
                  </label>
                </div>
              </div>
            </>
          )}
          
          {currentPlan === 'basico' ? (
            <button
              disabled
              className="w-full bg-green-100 text-green-700 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
            >
              ✅ Plan Actual
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={processing}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade a Básico
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de estado */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}