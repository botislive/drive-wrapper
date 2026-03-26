// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function getURL() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`
  }

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

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
