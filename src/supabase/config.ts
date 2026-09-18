import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing required Supabase environment variables. ` +
    `Copy .env.example to .env and fill in the values.`
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
