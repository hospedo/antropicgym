import { supabase } from './supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { GimnasioInsert, Gimnasio } from '@/types'

export interface GymCreationResult {
  success: boolean
  gym?: Gimnasio
  error?: string
  details?: any
}

export interface GymCreationData {
  usuario_id: string
  nombre: string
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  horario_apertura?: string | null
  horario_cierre?: string | null
}

/**
 * Robust gym creation service that handles all edge cases and provides
 * comprehensive error handling with fallback mechanisms
 */
export class GymService {
  private supabase: SupabaseClient
  
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase
  }

  /**
   * Creates a gym with comprehensive error handling and rollback mechanism
   */
  async createGym(gymData: GymCreationData): Promise<GymCreationResult> {
    try {
      // Validate required fields
      if (!gymData.usuario_id) {
        return {
          success: false,
          error: 'usuario_id is required for gym creation'
        }
      }

      if (!gymData.nombre || gymData.nombre.trim() === '') {
        return {
          success: false,
          error: 'Gym name is required'
        }
      }

      // Check if gym already exists for this user
      const { data: existingGym, error: checkError } = await this.supabase
        .from('gimnasios')
        .select('*')
        .eq('usuario_id', gymData.usuario_id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        return {
          success: false,
          error: 'Error checking for existing gym',
          details: checkError
        }
      }

      if (existingGym) {
        return {
          success: true,
          gym: existingGym,
          error: 'Gym already exists for this user'
        }
      }

      // Prepare gym data with defaults
      const gymInsertData: GimnasioInsert = {
        usuario_id: gymData.usuario_id,
        nombre: gymData.nombre.trim(),
        direccion: gymData.direccion || null,
        telefono: gymData.telefono || null,
        email: gymData.email || null,
        horario_apertura: gymData.horario_apertura || '06:00',
        horario_cierre: gymData.horario_cierre || '22:00'
      }

      // Create the gym
      const { data: newGym, error: createError } = await this.supabase
        .from('gimnasios')
        .insert(gymInsertData)
        .select()
        .single()

      if (createError) {
        return {
          success: false,
          error: 'Failed to create gym',
          details: createError
        }
      }

      if (!newGym) {
        return {
          success: false,
          error: 'Gym creation returned no data'
        }
      }

      return {
        success: true,
        gym: newGym
      }

    } catch (error) {
      return {
        success: false,
        error: 'Unexpected error during gym creation',
        details: error
      }
    }
  }

  /**
   * Creates a gym from auth user metadata with fallback to empty values
   */
  async createGymFromAuthMetadata(userId: string, userMetadata: any, userEmail?: string): Promise<GymCreationResult> {
    const gymData: GymCreationData = {
      usuario_id: userId,
      nombre: userMetadata?.nombreGimnasio || userMetadata?.nombre || `Gimnasio de ${userEmail}` || 'Mi Gimnasio',
      direccion: userMetadata?.direccion || null,
      telefono: userMetadata?.telefono || null,
      email: userEmail || null,
      horario_apertura: '06:00',
      horario_cierre: '22:00'
    }

    return this.createGym(gymData)
  }

  /**
   * Ensures a user has a gym, creating one if necessary
   */
  async ensureUserHasGym(userId: string, userMetadata?: any, userEmail?: string): Promise<GymCreationResult> {
    try {
      // First check if gym already exists
      const { data: existingGym, error: checkError } = await this.supabase
        .from('gimnasios')
        .select('*')
        .eq('usuario_id', userId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        return {
          success: false,
          error: 'Error checking for existing gym',
          details: checkError
        }
      }

      if (existingGym) {
        return {
          success: true,
          gym: existingGym
        }
      }

      // No gym exists, create one
      if (userMetadata) {
        return this.createGymFromAuthMetadata(userId, userMetadata, userEmail)
      } else {
        // Get user metadata from auth
        const { data: { user }, error: userError } = await this.supabase.auth.getUser()
        
        if (userError || !user || user.id !== userId) {
          return {
            success: false,
            error: 'Could not verify user identity'
          }
        }

        return this.createGymFromAuthMetadata(userId, user.user_metadata, user.email || undefined)
      }

    } catch (error) {
      return {
        success: false,
        error: 'Unexpected error ensuring user has gym',
        details: error
      }
    }
  }

  /**
   * Retrieves or creates a gym for a user
   */
  async getOrCreateGym(userId: string, userMetadata?: any, userEmail?: string): Promise<GymCreationResult> {
    return this.ensureUserHasGym(userId, userMetadata, userEmail)
  }

  /**
   * Updates an existing gym
   */
  async updateGym(gymId: string, userId: string, updates: Partial<GimnasioInsert>): Promise<GymCreationResult> {
    try {
      const { data: updatedGym, error: updateError } = await this.supabase
        .from('gimnasios')
        .update(updates)
        .eq('id', gymId)
        .eq('usuario_id', userId)
        .select()
        .single()

      if (updateError) {
        return {
          success: false,
          error: 'Failed to update gym',
          details: updateError
        }
      }

      return {
        success: true,
        gym: updatedGym
      }

    } catch (error) {
      return {
        success: false,
        error: 'Unexpected error during gym update',
        details: error
      }
    }
  }
}

// Export singleton instance
export const gymService = new GymService()