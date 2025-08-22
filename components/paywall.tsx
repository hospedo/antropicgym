'use client'

import { useSubscription } from '@/lib/use-subscription'
import { CheckCircle, CreditCard, Clock, AlertTriangle, Crown } from 'lucide-react'
import Link from 'next/link'

interface PaywallProps {
  children: React.ReactNode
  showTrialInfo?: boolean
}

export default function Paywall({ children, showTrialInfo = true }: PaywallProps) {
  const { hasAccess, isTrialActive, daysRemaining, subscription, loading } = useSubscription()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Si tiene acceso, mostrar el contenido
  if (hasAccess) {
    return (
      <>
        {showTrialInfo && isTrialActive && (
          <TrialBanner daysRemaining={daysRemaining} />
        )}
        {children}
      </>
    )
  }

  // Si no tiene acceso, mostrar paywall
  return <PaywallScreen subscription={subscription} />
}

function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const urgencyColor = daysRemaining <= 7 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
  const textColor = daysRemaining <= 7 ? 'text-red-700' : 'text-yellow-700'
  const iconColor = daysRemaining <= 7 ? 'text-red-500' : 'text-yellow-500'

  return (
    <div className={`border-b ${urgencyColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className={`h-5 w-5 ${iconColor}`} />
            <p className={`font-medium ${textColor}`}>
              {daysRemaining > 0 
                ? `Te quedan ${daysRemaining} días de prueba gratuita`
                : 'Tu prueba gratuita ha terminado'
              }
            </p>
          </div>
          <Link
            href="/dashboard/suscripcion"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Suscribirse Ahora
          </Link>
        </div>
      </div>
    </div>
  )
}

function PaywallScreen({ subscription }: { subscription: any }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Tiempo de suscribirse!
          </h2>
          <p className="text-gray-600">
            Tu prueba gratuita de 30 días ha terminado. Continúa disfrutando de todas las funciones de ANTROPIC.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-purple-600">$150</span>
            <span className="text-gray-600 ml-2">/usuario/mes</span>
          </div>
          
          <ul className="space-y-3 text-left">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">AI Coach Viral ilimitado</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Gestión completa de clientes</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Analytics avanzados</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Soporte prioritario</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Integración WhatsApp</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard/suscripcion"
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Suscribirse Ahora
          </Link>
          
          <p className="text-xs text-gray-500">
            Sin permanencia • Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente más simple para mostrar solo el estado de la suscripción
export function SubscriptionStatus() {
  const { hasAccess, isTrialActive, daysRemaining, loading } = useSubscription()

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center text-red-600">
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Suscripción expirada</span>
      </div>
    )
  }

  if (isTrialActive) {
    const urgencyColor = daysRemaining <= 7 ? 'text-red-600' : 'text-yellow-600'
    return (
      <div className={`flex items-center ${urgencyColor}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {daysRemaining} días de prueba
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center text-green-600">
      <CheckCircle className="h-4 w-4 mr-1" />
      <span className="text-sm font-medium">Suscripción activa</span>
    </div>
  )
}