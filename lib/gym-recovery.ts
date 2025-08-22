import { supabase } from './supabase'

export interface GymRecoveryResult {
  success: boolean
  gym?: any
  error?: string
  message?: string
}

/**
 * Client-side utility to ensure a user has a gym by calling the API endpoint
 */
export async function ensureUserHasGym(): Promise<GymRecoveryResult> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Call the gym ensure API endpoint
    const response = await fetch('/api/gym/ensure', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to ensure gym exists',
        message: errorData.details
      }
    }

    const result = await response.json()
    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while ensuring gym exists',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if the user has a gym without creating one
 */
export async function checkUserGymStatus(): Promise<GymRecoveryResult> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Call the gym status API endpoint
    const response = await fetch('/api/gym/ensure', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to check gym status',
        message: errorData.details
      }
    }

    const result = await response.json()
    return result

  } catch (error) {
    return {
      success: false,
      error: 'Network error while checking gym status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}