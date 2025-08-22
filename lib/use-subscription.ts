import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Subscription } from '@/types'

interface SubscriptionStatus {
  hasAccess: boolean
  isTrialActive: boolean
  daysRemaining: number
  subscription: Subscription | null
  currentPlan: 'gratuito' | 'basico'
  loading: boolean
  error: string | null
}

export function useSubscription(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasAccess: false,
    isTrialActive: false,
    daysRemaining: 0,
    subscription: null,
    currentPlan: 'gratuito',
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          if (mounted) {
            setStatus(prev => ({
              ...prev,
              loading: false,
              error: 'Usuario no autenticado'
            }))
          }
          return
        }

        // Obtener suscripción del usuario
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('usuario_id', user.id)
          .single()

        if (subscriptionError) {
          // Si la tabla no existe o no hay suscripción, crear acceso básico temporal
          if (subscriptionError.code === 'PGRST116' || subscriptionError.message.includes('relation') || subscriptionError.message.includes('does not exist')) {
            console.warn('Subscriptions table not found, providing basic access')
            if (mounted) {
              setStatus({
                hasAccess: true, // Acceso básico temporal
                isTrialActive: true,
                daysRemaining: 30,
                subscription: null,
                currentPlan: 'gratuito',
                loading: false,
                error: null
              })
            }
            return
          }
          
          if (mounted) {
            setStatus(prev => ({
              ...prev,
              loading: false,
              error: subscriptionError.message
            }))
          }
          return
        }

        // Calcular días restantes
        const trialEndDate = new Date(subscription.trial_end_date)
        const now = new Date()
        const timeDiff = trialEndDate.getTime() - now.getTime()
        const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)))

        // Determinar estado
        const isTrialActive = subscription.status === 'trial' && daysRemaining > 0
        const isSubscriptionActive = subscription.status === 'active' && 
          (subscription.subscription_end_date === null || 
           new Date(subscription.subscription_end_date) > now)
        
        const hasAccess = isTrialActive || isSubscriptionActive
        const currentPlan = subscription.status === 'active' ? 'basico' : 'gratuito'

        if (mounted) {
          setStatus({
            hasAccess,
            isTrialActive,
            daysRemaining,
            subscription,
            currentPlan,
            loading: false,
            error: null
          })
        }

      } catch (error: any) {
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Error al verificar suscripción'
          }))
        }
      }
    }

    checkSubscription()

    // Verificar cada 5 minutos
    const interval = setInterval(checkSubscription, 5 * 60 * 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return status
}

// Función para crear suscripción inicial (llamar al registrarse)
export async function createInitialSubscription(userId: string, gimnasioId?: string) {
  try {
    console.log('Creating initial subscription for user:', userId)
    
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        usuario_id: userId,
        gimnasio_id: gimnasioId || null,
        status: 'trial',
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      })

    if (error) {
      console.error('Subscription creation error:', error)
      throw error
    }

    console.log('Subscription created successfully')
    return { success: true }
  } catch (error: any) {
    console.error('Exception in createInitialSubscription:', error)
    return { success: false, error: error.message }
  }
}

// Función para activar suscripción pagada
export async function activateSubscription(userId: string, paymentMethod: string) {
  try {
    const now = new Date()
    const nextBilling = new Date()
    nextBilling.setMonth(nextBilling.getMonth() + 1) // Próximo mes

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        subscription_start_date: now.toISOString(),
        last_billing_date: now.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        payment_method: paymentMethod,
        updated_at: now.toISOString()
      })
      .eq('usuario_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}