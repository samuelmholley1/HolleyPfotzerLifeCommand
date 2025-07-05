require('dotenv').config();
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: REACT_APP_SUPABASE_URL or SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: REACT_APP_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY')
}

// Singleton Supabase client instance
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

// Export singleton instance
export const supabase = getSupabaseClient()

// Export types for TypeScript
export type { User, Session, SupabaseClient } from '@supabase/supabase-js'
