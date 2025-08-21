import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Create Supabase client dynamically to avoid build-time errors
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    return {} as ReturnType<typeof createClient<Database>>
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

export default supabase