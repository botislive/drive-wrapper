// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== 'undefined') {
      console.error('Supabase configuration missing!')
    }
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!
  )
}
