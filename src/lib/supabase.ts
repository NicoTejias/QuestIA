import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzkwmiyzszegekpuqnaz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. VITE_SUPABASE_URL:', supabaseUrl, 'VITE_SUPABASE_ANON_KEY:', supabaseAnonKey)
}

// Client for frontend (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export type SupabaseClient = typeof supabase
